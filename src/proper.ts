import type { NodePath } from '@babel/core'
import { MParams, Frame } from './types'
import * as t from '@babel/types'

export function proper(path: NodePath, options: MParams, variableMaps: Set<string>) {
  const { opts, addImportName } = options
  // currentVariableDeclarator, currentCallExpression, currentFunction
  // must be deconstructed
  const currentFunction = path.getFunctionParent() as MParams['currentFunction']

  if (
    t.isVariableDeclarator(path.parentPath.parentPath.node) &&
    t.isObjectPattern(path.parentPath.parentPath.node.id)
  ) {
    path.parentPath.parentPath.node.id.properties.forEach((item) => {
      if (t.isObjectProperty(item) && t.isIdentifier(item.value)) {
        variableMaps.add(item.value.name)
      }
    })
  } else {
    throw new Error('must use destructuring')
  }

  if (!t.isCallExpression(path.parentPath.node)) {
    throw new Error('must be called directly')
  }

  const { properties: variableDeclaratorProperties } = path.parentPath.parentPath.node.id
  const [props, defaultProps] = path.parentPath.node.arguments

  const mergeProps = defaultProps
    ? t.objectExpression([
        t.spreadElement(defaultProps as t.Expression),
        t.spreadElement(props as t.Expression)
      ])
    : props

  switch (opts.frame) {
    case Frame.react:
      path.parentPath.replaceWith(mergeProps)
      break
    case Frame.vue:
      {
        const hookToRefsId = addImportName('toRefs', 'vue')

        path.parentPath.replaceWith(
          t.callExpression(hookToRefsId, [
            // If there is a need to merge props you need to set readonly and reactive to keep responsive
            defaultProps
              ? t.callExpression(addImportName('readonly', 'vue'), [
                  t.callExpression(addImportName('reactive', 'vue'), [mergeProps])
                ])
              : mergeProps
          ])
        )

        const Identifiers: NodePath<t.Identifier>[] = []
        let restElement: string | null = null

        // collects the deconstructed values and records the remaining values
        const statementNames = variableDeclaratorProperties.reduce((memo, item, index, arr) => {
          if (t.isObjectProperty(item) && t.isIdentifier(item.value)) {
            if (item.value.name === 'children') {
              arr[index] = null
            } else {
              memo[item.value.name] = item.value.start
            }
          }

          if (t.isRestElement(item) && t.isIdentifier(item.argument)) {
            restElement = item.argument.name
            arr[index] = null
          }

          return memo
        }, {})

        let childrenPath: NodePath<t.Node> | null = null

        currentFunction.traverse({
          Identifier(IPath) {
            if (
              statementNames[IPath.node.name] &&
              !t.isObjectProperty(IPath.parentPath) &&
              !t.isVariableDeclarator(IPath.parentPath.node)
            ) {
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

              Identifiers.push(IPath)
            }

            if (IPath.node.name === 'children') {
              childrenPath = IPath
            }
          }
        })

        if (childrenPath) {
          childrenPath.replaceWith(
            t.callExpression(
              t.memberExpression(t.identifier('_slots_'), t.identifier('children')),
              []
            )
          )
        }

        if (t.isObjectExpression(currentFunction.parentPath.node)) {
          // handle rest
          currentFunction.parentPath.node.properties.forEach((item) => {
            if (
              t.isObjectMethod(item) &&
              t.isIdentifier(item.key) &&
              item.key.name === 'setup' &&
              t.isObjectPattern(item.params[1])
            ) {
              item.params[1].properties.forEach((PPath) => {
                if (
                  t.isObjectProperty(PPath) &&
                  t.isIdentifier(PPath.key) &&
                  PPath.key.name === 'attrs'
                ) {
                  PPath.value = t.identifier(restElement)
                }
              })
            }
          })

          currentFunction.parentPath.node.properties.unshift(
            t.objectProperty(
              t.identifier('props'),
              t.arrayExpression(Identifiers.map((item) => t.stringLiteral(item.node.name)))
            )
          )
        }

        Identifiers.forEach((item) => {
          item.replaceWith(t.memberExpression(t.identifier(item.node.name), t.identifier('value')))
        })
      }
      break
    case Frame.solid:
      {
        const nameId = addImportName('splitProps', 'solid-js')

        let restElement: t.Identifier | null = null
        const statementNames = variableDeclaratorProperties.reduce((memo, item) => {
          if (t.isObjectProperty(item) && t.isIdentifier(item.value) && t.isIdentifier(item.key)) {
            memo[item.value.name] = { key: item.key.name, start: item.value.start }
          }

          if (t.isRestElement(item) && t.isIdentifier(item.argument)) {
            restElement = t.identifier(item.argument.name)
          }

          return memo
        }, {})

        // split props object
        const local = t.identifier('_local_')
        path.parentPath.parentPath.node.id = t.arrayPattern(
          restElement ? [local, restElement] : [local]
        )

        const Identifiers: { path: NodePath<t.Identifier>; name: string }[] = []

        path.parentPath.replaceWith(
          t.callExpression(nameId, [
            defaultProps
              ? t.callExpression(addImportName('mergeProps', 'solid-js'), [defaultProps, props])
              : props,
            t.arrayExpression(
              Object.keys(statementNames).map((item) => t.stringLiteral(statementNames[item].key))
            )
          ])
        )

        currentFunction.traverse({
          Identifier(IPath) {
            if (
              statementNames[IPath.node.name] &&
              !t.isObjectProperty(IPath.parentPath) &&
              !t.isVariableDeclarator(IPath.parentPath.node)
            ) {
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

              Identifiers.push({ path: IPath, name: statementNames[IPath.node.name].key })
            }
          }
        })

        Identifiers.forEach((item) => {
          item.path.replaceWith(t.memberExpression(local, t.identifier(item.name)))
        })
      }
      break
  }
}
