import * as t from '@babel/types'
import { NodePath } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'
import { MParams } from './types'
import { Scope } from '@babel/traverse'

type Argument = t.Expression | t.SpreadElement | t.JSXNamespacedName | t.ArgumentPlaceholder

function getInitState(path: NodePath): Argument {
  const callExpression = path.findParent((p) => t.isCallExpression(p)) as NodePath<t.CallExpression>
  return callExpression.node.arguments[0]
}

const hookCacheId = new Map()

export function state(path: NodePath, options: MParams) {
  const { opts, file } = options

  const variableDeclaration = path.findParent((p) =>
    t.isVariableDeclaration(p)
  ) as NodePath<t.VariableDeclaration>

  const stateVariable = path
    .find((p) => t.isVariableDeclarator(p))!
    .get('id') as NodePath<t.ArrayPattern>

  const initState = getInitState(path)

  const functionDeclaration = path.getFunctionParent()!

  switch (opts.frame) {
    case 'react':
      {
        const hookId = hookCacheId.get(file.code) ?? addNamed(path, 'useState', 'react')
        hookCacheId.set(file.code, hookCacheId)

        variableDeclaration.insertAfter(
          t.variableDeclaration('const', [
            t.variableDeclarator(stateVariable.node, t.callExpression(hookId, [initState]))
          ])
        )
      }
      break
    case 'vue':
      {
        const hookId = hookCacheId.get(file.code) ?? addNamed(path, 'ref', 'vue')
        hookCacheId.set(file.code, hookId)

        // use const to create ref
        variableDeclaration.insertAfter(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              stateVariable.node.elements[0],
              t.callExpression(hookId, [initState])
            )
          ])
        )

        const Identifiers: NodePath<t.Identifier>[] = []
        const setIdentifiers: NodePath<t.CallExpression>[] = []
        let currentScope: Scope
        functionDeclaration.traverse({
          Identifier(IPath) {
            if (
              IPath.node.name === (stateVariable.node.elements[1] as t.Identifier).name &&
              // exclude initialization nodes
              stateVariable.node.start !== IPath.node.start &&
              // and new replacement nodes, new node without start
              IPath.node.start &&
              functionDeclaration.scope.hasOwnBinding(IPath.node.name) &&
              t.isCallExpression(IPath.parentPath)
            ) {
              // handling set methods
              setIdentifiers.push(IPath.parentPath as NodePath<t.CallExpression>)
            }

            if (
              IPath.node.name === (stateVariable.node.elements[0] as t.Identifier).name &&
              // exclude initialization nodes
              stateVariable.node.elements[0].start !== IPath.node.start &&
              // and new replacement nodes, new node without start
              IPath.node.start &&
              functionDeclaration.scope.hasOwnBinding(IPath.node.name)
            ) {
              const IPathParent = IPath.parentPath.parentPath

              // If it is an assignment expression
              // the current scope is saved
              // the assignment always precedes the use
              if (t.isVariableDeclaration(IPathParent)) {
                currentScope = IPath.scope
              }

              if (
                !t.isVariableDeclaration(IPathParent) &&
                // If it is in the same scope as the assignment expression, it will not be processed
                currentScope?.block.start !== IPath.scope.block.start
              ) {
                Identifiers.push(IPath)
              }
            }
          }
        })

        Identifiers.forEach((item) => {
          item.replaceWith(t.memberExpression(t.identifier(item.node.name), t.identifier('value')))
        })

        setIdentifiers.forEach((item) => {
          if (
            t.isBinaryExpression(item.node.arguments[0]) ||
            t.isArrayExpression(item.node.arguments[0])
          ) {
            item.replaceWith(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  stateVariable.node.elements[0] as t.Identifier,
                  t.identifier('value')
                ),
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
                        t.memberExpression(
                          stateVariable.node.elements[0] as t.Expression,
                          t.identifier('value')
                        ),
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
    case 'solid':
      {
        const hookId = hookCacheId.get(file.code) ?? addNamed(path, 'createSignal', 'solid-js')
        hookCacheId.set(file.code, hookId)

        variableDeclaration.insertAfter(
          t.variableDeclaration('const', [
            t.variableDeclarator(stateVariable.node, t.callExpression(hookId, [initState]))
          ])
        )

        const Identifiers: NodePath<t.Identifier>[] = []

        let currentScope: Scope
        functionDeclaration.traverse({
          Identifier(IPath) {
            if (
              IPath.node.name === (stateVariable.node.elements[0] as t.Identifier).name &&
              // exclude initialization nodes
              stateVariable.node.elements[0].start !== IPath.node.start &&
              // and new replacement nodes, new node without start
              IPath.node.start &&
              functionDeclaration.scope.hasOwnBinding(IPath.node.name)
            ) {
              const IPathParent = IPath.parentPath.parentPath

              // If it is an assignment expression
              // the current scope is saved
              // the assignment always precedes the use
              if (t.isVariableDeclaration(IPathParent)) {
                currentScope = IPath.scope
              }

              const isAssignmentExpression = IPath.findParent((item) =>
                t.isAssignmentExpression(item)
              )

              if (
                !isAssignmentExpression &&
                !t.isVariableDeclaration(IPathParent) &&
                // If it is in the same scope as the assignment expression, it will not be processed
                currentScope?.block.start !== IPath.scope.block.start
              ) {
                Identifiers.push(IPath)
              }
            }
          }
        })

        Identifiers.forEach((item) => {
          item.replaceWith(t.callExpression(t.identifier(item.node.name), []))
        })
      }
      break
    default:
      break
  }

  path.replaceWith(initState)
  variableDeclaration.remove()
}
