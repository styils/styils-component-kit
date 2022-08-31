import { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function component(path: NodePath, options: MParams) {
  const { opts } = options

  if (opts.frame === 'vue') {
    if (
      t.isCallExpression(path.parentPath.node) &&
      t.isArrowFunctionExpression(path.parentPath.node.arguments[0])
    ) {
      path.parentPath.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('inheritAttrs'), t.booleanLiteral(false)),
          t.objectMethod(
            'method',
            t.identifier('setup'),
            [
              t.identifier('props'),
              t.objectPattern([
                t.objectProperty(t.identifier('attrs'), t.identifier('_attrs_')),
                t.objectProperty(t.identifier('slots'), t.identifier('_slots_')),
                t.objectProperty(t.identifier('emit'), t.identifier('_emit_')),
                t.objectProperty(t.identifier('expose'), t.identifier('_expose_'))
              ])
            ],
            path.parentPath.node.arguments[0].body as t.BlockStatement
          )
        ])
      )
    }
  }
}
