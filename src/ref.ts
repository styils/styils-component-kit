import type { NodePath } from '@babel/core'
import { MParams, Frame } from './types'
import * as t from '@babel/types'

export function ref(path: NodePath, options: MParams) {
  const { opts, addImportName, currentCallExpression, identifiers } = options

  switch (opts.frame) {
    case Frame.react:
      {
        const nameId = addImportName('useRef', 'react')
        currentCallExpression.replaceWith(
          t.callExpression(nameId, currentCallExpression.node.arguments)
        )

        identifiers.forEach((item) => {
          item.replaceWith(t.memberExpression(item.node, t.identifier('current')))
        })
      }
      break
    case Frame.vue:
      {
        const nameId = addImportName('ref', 'vue')
        path.parentPath.replaceWith(t.callExpression(nameId, currentCallExpression.node.arguments))

        identifiers.forEach((item) => {
          item.replaceWith(t.memberExpression(item.node, t.identifier('value')))
        })
      }
      break
    case Frame.solid:
      path.parentPath.replaceWith(currentCallExpression.node.arguments[0])
      break
  }
}
