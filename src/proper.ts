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
          let restElement: string | null = null

          const statementNames = variableDeclarator.node.id.properties.reduce(
            (memo, item, index, arr) => {
              if (t.isObjectProperty(item) && t.isIdentifier(item.value)) {
                memo[item.value.name] = item.value.start
              }

              if (t.isRestElement(item) && t.isIdentifier(item.argument)) {
                restElement = item.argument.name
                arr[index] = null
              }

              return memo
            },
            {}
          )

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

          if (t.isObjectExpression(functionDeclaration.parentPath.node)) {
            functionDeclaration.parentPath.node.properties.forEach((item) => {
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

            functionDeclaration.parentPath.node.properties.unshift(
              t.objectProperty(
                t.identifier('props'),
                t.arrayExpression(Identifiers.map((item) => t.stringLiteral(item.node.name)))
              )
            )
          }

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

          const local = t.identifier('_local_')

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
