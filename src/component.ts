import { NodePath } from '@babel/traverse'

import * as t from '@babel/types'

export function component(path: NodePath, frame: string) {
  if (frame === 'vue') {
    if (
      t.isCallExpression(path.parentPath.node) &&
      (t.isArrowFunctionExpression(path.parentPath.node.arguments[0]) ||
        t.isFunctionExpression(path.parentPath.node.arguments[0]))
    ) {
      const { start } = path.parentPath.node.arguments[0]
      path.parentPath.traverse({
        ReturnStatement(RPath) {
          if (RPath.getFunctionParent().node.start === start) {
            RPath.replaceWith(t.arrowFunctionExpression([], RPath.node.argument))
          }
        }
      })

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
  } else if (t.isCallExpression(path.parentPath.node)) {
    path.parentPath.replaceWith(path.parentPath.node.arguments[0])
  }
}
