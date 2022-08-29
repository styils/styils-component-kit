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

export function MState(path: NodePath, options: MParams) {
  const { opts, file } = options

  const variableDeclaration = path.findParent((p) =>
    t.isVariableDeclaration(p)
  ) as NodePath<t.VariableDeclaration>

  const stateVariable = path
    .find((p) => t.isVariableDeclarator(p))!
    .get('id') as NodePath<t.Identifier>

  const initState = getInitState(path)

  const functionDeclaration = path.getFunctionParent()!

  switch (opts.frame) {
    case 'react':
      {
        const hookId = hookCacheId.get(file.code) ?? addNamed(path, 'useState', 'react')
        hookCacheId.set(file.code, hookCacheId)
        const updater = path.scope.generateUidIdentifier(`set${stateVariable.node.name}`)

        variableDeclaration.insertAfter(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.arrayPattern([t.identifier(stateVariable.node.name), updater]),
              t.callExpression(hookId, [initState])
            )
          ])
        )

        // find assignment expression to replace
        functionDeclaration.traverse({
          AssignmentExpression(APath: NodePath<t.AssignmentExpression>) {
            const variable = APath.get('left').node
            if (
              t.isIdentifier(variable) &&
              functionDeclaration.scope.hasOwnBinding(variable.name) &&
              variable.name === stateVariable.node.name
            ) {
              const stateName = functionDeclaration.scope.generateUidIdentifier(
                stateVariable.node.name
              )
              APath.get('right').traverse({
                Identifier(p: NodePath<t.Identifier>) {
                  if (
                    functionDeclaration.scope.hasOwnBinding(p.node.name) &&
                    p.node.name === stateVariable.node.name
                  ) {
                    p.replaceWith(stateName)
                  }
                }
              })
              APath.replaceWith(
                t.callExpression(updater, [
                  t.arrowFunctionExpression(
                    [stateName],
                    t.assignmentExpression(APath.node.operator, stateName, APath.get('right').node)
                  )
                ])
              )
            }
          }
        })
      }
      break
    case 'vue':
      {
        const hookId = hookCacheId.get(file.code) ?? addNamed(path, 'ref', 'vue')
        hookCacheId.set(file.code, hookId)

        variableDeclaration.insertAfter(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(stateVariable.node.name),
              t.callExpression(hookId, [initState])
            )
          ])
        )

        const Identifiers: NodePath<t.Identifier>[] = []
        let currentScope: Scope
        functionDeclaration.traverse({
          Identifier(IPath) {
            if (
              IPath.node.name === stateVariable.node.name &&
              // exclude initialization nodes
              stateVariable.node.start !== IPath.node.start &&
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
      }
      break
    case 'solid':
      break
    default:
      break
  }

  path.replaceWith(initState)
  variableDeclaration.remove()
}
