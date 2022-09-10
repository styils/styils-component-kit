import * as t from '@babel/types'
import { NodePath } from '@babel/core'
import { MParams, Frame } from './types'

export function state(path: NodePath, options: MParams, variableMaps: Set<string>) {
  const { opts, addImportName } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    // Macros must be called directly, otherwise the correct call cannot be traced
    throw new Error('All macros must be called')
  }

  const currentVariableDeclaration = path.findParent((p) =>
    t.isVariableDeclaration(p)
  ) as NodePath<t.VariableDeclaration>

  const currentCallExpression = path.findParent((p) =>
    t.isCallExpression(p)
  ) as NodePath<t.CallExpression>

  const currentFunction = path.getFunctionParent() as NodePath<
    t.FunctionDeclaration | t.FunctionExpression | t.ObjectMethod | t.ArrowFunctionExpression
  >
  const currentVariableDeclarator = path.parentPath.parentPath.node

  const identifiers: NodePath<t.Identifier>[] = []
  const setIdentifiers: NodePath<t.CallExpression>[] = []

  if (t.isVariableDeclarator(currentVariableDeclarator)) {
    if (
      t.isIdentifier(currentVariableDeclarator.id) ||
      t.isArrayPattern(currentVariableDeclarator.id)
    ) {
      let identNodeName: { name: string; start: number } | undefined
      let setIdentNode: { name: string; start: number } | undefined

      if (t.isIdentifier(currentVariableDeclarator.id)) {
        identNodeName = {
          start: currentVariableDeclarator.id.start,
          name: currentVariableDeclarator.id.name
        }
      }

      if (
        t.isArrayPattern(currentVariableDeclarator.id) &&
        t.isIdentifier(currentVariableDeclarator.id.elements[0])
      ) {
        const [variable, setVariable] = currentVariableDeclarator.id.elements
        if (t.isIdentifier(variable)) {
          identNodeName = {
            start: variable.start,
            name: variable.name
          }
        }

        if (t.isIdentifier(setVariable)) {
          setIdentNode = {
            start: setVariable.start,
            name: setVariable.name
          }
        }
      }

      currentFunction.traverse({
        Identifier(IPath) {
          if (
            setIdentNode &&
            IPath.node.name === setIdentNode.name &&
            // exclude initialization nodes
            setIdentNode.start !== IPath.node.start &&
            // and new replacement nodes, new node without start
            IPath.node.start &&
            currentFunction.scope.hasOwnBinding(IPath.node.name) &&
            t.isCallExpression(IPath.parentPath)
          ) {
            // handling set methods
            setIdentifiers.push(IPath.parentPath as NodePath<t.CallExpression>)
          }

          if (
            identNodeName &&
            IPath.node.name === identNodeName.name &&
            // exclude initialization nodes
            identNodeName.start !== IPath.node.start &&
            // and new replacement nodes, new node without start
            IPath.node.start &&
            !t.isVariableDeclaration(IPath.parentPath.node) &&
            currentFunction.scope.hasOwnBinding(IPath.node.name)
          ) {
            // If it is an assignment expression
            // the current scope is saved
            // the assignment always precedes the use
            let scoper = IPath.scope

            while (scoper) {
              if (scoper.hasOwnBinding(IPath.node.name)) {
                if (scoper.block.start === path.scope.block.start) {
                  break
                } else {
                  return
                }
              }

              scoper = scoper.parent
            }

            const isRefJsxValue = IPath.findParent(
              (item) =>
                t.isJSXAttribute(item.node) &&
                t.isJSXIdentifier(item.node.name) &&
                item.node.name.name === 'ref'
            )

            if (!isRefJsxValue) {
              identifiers.push(IPath)
            }
          }
        }
      })
    }
  }

  if (
    t.isVariableDeclarator(currentVariableDeclarator) &&
    t.isArrayPattern(currentVariableDeclarator.id)
  ) {
    const [variable] = currentVariableDeclarator.id.elements as t.Identifier[]

    switch (opts.frame) {
      case Frame.react:
        {
          const nameId = addImportName('useState', 'react')
          variableMaps.add(variable.name)
          path.replaceWith(nameId)
        }
        break
      case Frame.vue:
        {
          const nameId = addImportName('ref', 'vue')

          // use const to create ref
          currentVariableDeclaration.replaceWith(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                variable,
                t.callExpression(nameId, currentCallExpression.node.arguments)
              )
            ])
          )

          identifiers.forEach((item) => {
            variableMaps.add(item.node.name)
            item.replaceWith(
              t.memberExpression(t.identifier(item.node.name), t.identifier('value'))
            )
          })

          setIdentifiers.forEach((item) => {
            if (
              t.isBinaryExpression(item.node.arguments[0]) ||
              t.isArrayExpression(item.node.arguments[0])
            ) {
              item.replaceWith(
                t.assignmentExpression(
                  '=',
                  t.memberExpression(variable, t.identifier('value')),
                  item.node.arguments[0]
                )
              )
            } else if (t.isObjectExpression(item.node.arguments[0])) {
              const statement = []
              item.node.arguments[0].properties.forEach((property) => {
                if (t.isObjectProperty(property)) {
                  statement.push(
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        t.memberExpression(
                          t.memberExpression(variable, t.identifier('value')),
                          property.key
                        ),
                        property.value as t.Expression
                      )
                    )
                  )
                }
              })

              item.replaceWith(t.blockStatement(statement))
            }
          })
        }
        break
      case Frame.solid:
        {
          const nameId = addImportName('createSignal', 'solid-js')
          path.replaceWith(nameId)

          const setBlock = new Map<NodePath<t.Function>, number>()

          setIdentifiers.forEach((item) => {
            const func = item.getFunctionParent()

            if (func && func.node.start !== currentFunction.node.start) {
              const num = setBlock.get(func)
              if (num) {
                setBlock.set(func, num + 1)
              } else {
                setBlock.set(func, 1)
              }
            }
          })

          const nameBatchId = addImportName('batch', 'solid-js')

          setBlock.forEach((item, SPath) => {
            if (item > 1) {
              const { params } = SPath.node

              SPath.node.params = []
              if (t.isFunctionDeclaration(SPath.node)) {
                SPath.replaceWith(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(
                      t.identifier(SPath.node.id.name),
                      t.arrowFunctionExpression(
                        params as t.Identifier[],
                        t.callExpression(nameBatchId, [
                          t.functionExpression(null, SPath.node.params, SPath.node.body)
                        ])
                      )
                    )
                  ])
                )
              } else {
                SPath.replaceWith(
                  t.arrowFunctionExpression(
                    params as t.Identifier[],
                    t.callExpression(nameBatchId, [SPath.node as t.ArrowFunctionExpression])
                  )
                )
              }
            }
          })

          identifiers.forEach((item) => {
            if (t.isUpdateExpression(item.parentPath.node)) {
              item.parentPath.replaceWith(
                t.binaryExpression(
                  item.parentPath.node.operator[0] as '-' | '+',
                  item.node,
                  t.numericLiteral(1)
                )
              )
            }

            variableMaps.add(item.node.name)
            item.replaceWith(t.callExpression(t.identifier(item.node.name), []))
          })
        }
        break
      default:
        break
    }
  }
}
