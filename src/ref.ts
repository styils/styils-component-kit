import type { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function ref(path: NodePath, options: MParams) {
  const { opts, addImportName } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      {
        const nameId = addImportName(path, 'useRef', 'react')
        path.parentPath.replaceWith(t.callExpression(nameId, path.parentPath.node.arguments))

        const stateVariable = path
          .find((p) => t.isVariableDeclarator(p))!
          .get('id') as NodePath<t.Identifier>

        const functionDeclaration = path.getFunctionParent()
        const Identifiers: NodePath<t.Identifier>[] = []

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
              const isRefJsxValue = IPath.findParent(
                (item) =>
                  t.isJSXAttribute(item.node) &&
                  t.isJSXIdentifier(item.node.name) &&
                  item.node.name.name === 'ref'
              )

              if (!isRefJsxValue) {
                Identifiers.push(IPath)
              }
            }
          }
        })

        Identifiers.forEach((item) => {
          item.replaceWith(t.memberExpression(item.node, t.identifier('current')))
        })
      }
      break
    case 'vue':
      {
        const nameId = addImportName(path, 'ref', 'vue')
        path.parentPath.replaceWith(t.callExpression(nameId, path.parentPath.node.arguments))

        const stateVariable = path
          .find((p) => t.isVariableDeclarator(p))!
          .get('id') as NodePath<t.Identifier>

        const functionDeclaration = path.getFunctionParent()
        const Identifiers: NodePath<t.Identifier>[] = []

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
              const isRefJsxValue = IPath.findParent(
                (item) =>
                  t.isJSXAttribute(item.node) &&
                  t.isJSXIdentifier(item.node.name) &&
                  item.node.name.name === 'ref'
              )

              if (!isRefJsxValue) {
                Identifiers.push(IPath)
              }
            }
          }
        })

        Identifiers.forEach((item) => {
          item.replaceWith(t.memberExpression(item.node, t.identifier('value')))
        })
      }
      break
    case 'solid':
      path.parentPath.replaceWith(path.parentPath.node.arguments[0])
      break
  }
}
