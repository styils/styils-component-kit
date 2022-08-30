import type { NodePath } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'
import { MParams } from './types'
import * as t from '@babel/types'

export function proper(path: NodePath, options: MParams) {
  const { opts } = options

  const variableDeclarator = path.findParent((p) =>
    t.isVariableDeclarator(p)
  ) as NodePath<t.VariableDeclarator>

  const functionDeclaration = path.getFunctionParent()!

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      path.parentPath.replaceWith(path.parentPath.node.arguments[0])
      break
    case 'vue':
      {
        const hookId = addNamed(path, 'toRefs', 'vue')

        path.parentPath.replaceWith(t.callExpression(hookId, path.parentPath.node.arguments))

        if (variableDeclarator && t.isObjectPattern(variableDeclarator.node.id)) {
          const Identifiers: NodePath<t.Identifier>[] = []
          const statementNames = variableDeclarator.node.id.properties.reduce((memo, item) => {
            if (t.isObjectProperty(item) && t.isIdentifier(item.value)) {
              memo[item.value.name] = item.value.start
            }

            return memo
          }, {})

          functionDeclaration.traverse({
            Identifier(IPath) {
              if (
                statementNames[IPath.node.name] &&
                // exclude initialization nodes
                statementNames[IPath.node.name] !== IPath.node.start &&
                // and new replacement nodes, new node without start
                IPath.node.start &&
                functionDeclaration.scope.hasOwnBinding(IPath.node.name)
              ) {
                Identifiers.push(IPath)
              }
            }
          })

          Identifiers.forEach((item) => {
            item.replaceWith(
              t.memberExpression(t.identifier(item.node.name), t.identifier('value'))
            )
          })
        }
      }
      break
    case 'solid':
      {
        const hookId = addNamed(path, 'splitProps', 'solid-js')
        if (variableDeclarator && t.isObjectPattern(variableDeclarator.node.id)) {
          let restElement: t.Identifier | null = null
          const statementNames = variableDeclarator.node.id.properties.reduce((memo, item) => {
            if (
              t.isObjectProperty(item) &&
              t.isIdentifier(item.value) &&
              t.isIdentifier(item.key)
            ) {
              memo[item.value.name] = { key: item.key.name, start: item.value.start }
            }

            if (t.isRestElement(item) && t.isIdentifier(item.argument)) {
              restElement = t.identifier(item.argument.name)
            }

            return memo
          }, {})

          const local = t.identifier('_local')

          variableDeclarator.node.id = t.arrayPattern(restElement ? [local, restElement] : [local])

          const Identifiers: { path: NodePath<t.Identifier>; name: string }[] = []
          path.parentPath.replaceWith(
            t.callExpression(hookId, [
              path.parentPath.node.arguments[0],
              t.arrayExpression(
                Object.keys(statementNames).map((item) => t.stringLiteral(statementNames[item].key))
              )
            ])
          )

          functionDeclaration.traverse({
            Identifier(IPath) {
              if (statementNames[IPath.node.name]) {
                Identifiers.push({ path: IPath, name: statementNames[IPath.node.name].key })
              }
            }
          })

          Identifiers.forEach((item) => {
            item.path.replaceWith(t.memberExpression(local, t.identifier(item.name)))
          })
        }
      }
      break
  }
}
