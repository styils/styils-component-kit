import type { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function proper(path: NodePath, options: MParams, idxMaps: Set<string>) {
  const { opts, addImportName } = options

  const variableDeclarator = path.findParent((p) =>
    t.isVariableDeclarator(p)
  ) as NodePath<t.VariableDeclarator>

  ;(variableDeclarator.node.id as t.ObjectPattern).properties.forEach((item) => {
    if (t.isObjectProperty(item) && t.isIdentifier(item.value)) {
      idxMaps.add(item.value.name)
    }
  })

  const functionDeclaration = path.getFunctionParent()!

  const parentPathNode = path.parentPath.node as t.CallExpression

  switch (opts.frame) {
    case 'react':
      path.parentPath.replaceWith(
        parentPathNode.arguments[1]
          ? t.objectExpression([
              t.spreadElement(parentPathNode.arguments[1] as t.Expression),
              t.spreadElement(parentPathNode.arguments[0] as t.Expression)
            ])
          : parentPathNode.arguments[0]
      )

      break
    case 'vue':
      {
        const hookToRefsId = addImportName(path, 'toRefs', 'vue')

        if (parentPathNode.arguments.length === 2) {
          const hookReadonlyId = addImportName(path, 'readonly', 'vue')
          const hookReactiveId = addImportName(path, 'reactive', 'vue')

          path.parentPath.replaceWith(
            t.callExpression(hookToRefsId, [
              t.callExpression(hookReadonlyId, [
                t.callExpression(hookReactiveId, [
                  t.objectExpression([
                    t.spreadElement(parentPathNode.arguments[1] as t.Expression),
                    t.spreadElement(parentPathNode.arguments[0] as t.Expression)
                  ])
                ])
              ])
            ])
          )
        } else {
          path.parentPath.replaceWith(t.callExpression(hookToRefsId, parentPathNode.arguments))
        }

        if (variableDeclarator && t.isObjectPattern(variableDeclarator.node.id)) {
          const Identifiers: NodePath<t.Identifier>[] = []
          let restElement: string | null = null

          const statementNames = variableDeclarator.node.id.properties.reduce(
            (memo, item, index, arr) => {
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
            },
            {}
          )

          let childrenPath: NodePath<t.Node> | null = null

          functionDeclaration.traverse({
            Identifier(IPath) {
              if (
                statementNames[IPath.node.name] &&
                // exclude initialization nodes
                statementNames[IPath.node.name] !== IPath.node.start &&
                // and new replacement nodes, new node without start
                IPath.node.start &&
                !t.isObjectProperty(IPath.parentPath) &&
                functionDeclaration.scope.hasOwnBinding(IPath.node.name)
              ) {
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

          if (t.isObjectExpression(functionDeclaration.parentPath.node)) {
            // handle rest
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
        const nameId = addImportName(path, 'splitProps', 'solid-js')
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

          if (parentPathNode.arguments.length === 2) {
            const hookMergePropsId = addImportName(path, 'mergeProps', 'solid-js')
            path.parentPath.replaceWith(
              t.callExpression(nameId, [
                t.callExpression(hookMergePropsId, parentPathNode.arguments.reverse()),
                t.arrayExpression(
                  Object.keys(statementNames).map((item) =>
                    t.stringLiteral(statementNames[item].key)
                  )
                )
              ])
            )
          } else {
            path.parentPath.replaceWith(
              t.callExpression(nameId, [
                parentPathNode.arguments[0],
                t.arrayExpression(
                  Object.keys(statementNames).map((item) =>
                    t.stringLiteral(statementNames[item].key)
                  )
                )
              ])
            )
          }

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
