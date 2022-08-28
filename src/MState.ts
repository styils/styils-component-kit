import * as t from '@babel/types'
import { NodePath } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'
import { MParams } from './types'

type Argument = t.Expression | t.SpreadElement | t.JSXNamespacedName | t.ArgumentPlaceholder

function getInitState(path: NodePath): Argument {
  const callExpression = path.findParent((p) => t.isCallExpression(p)) as NodePath<t.CallExpression>
  return callExpression.node.arguments[0]
}

export function MState(path: NodePath, options: MParams) {
  const { opts } = options

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
      const hookId = addNamed(path, 'useState', 'react')
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
        AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
          const variable = path.get('left').node
          if (
            t.isIdentifier(variable) &&
            functionDeclaration.scope.hasOwnBinding(variable.name) &&
            variable.name == stateVariable.node.name
          ) {
            const stateName = functionDeclaration.scope.generateUidIdentifier(
              stateVariable.node.name
            )
            path.get('right').traverse({
              Identifier(p: NodePath<t.Identifier>) {
                if (
                  functionDeclaration.scope.hasOwnBinding(p.node.name) &&
                  p.node.name == stateVariable.node.name
                ) {
                  p.replaceWith(stateName)
                }
              }
            })
            path.replaceWith(
              t.callExpression(updater, [
                t.arrowFunctionExpression(
                  [stateName],
                  t.assignmentExpression(path.node.operator, stateName, path.get('right').node)
                )
              ])
            )
          }
        }
      })
      break
    case 'vue':
      break
    case 'solid':
      break
  }

  path.replaceWith(initState)
  variableDeclaration.remove()
}
