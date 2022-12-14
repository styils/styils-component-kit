import { Frame, type MParams } from './types'
import type { NodePath } from '@babel/core'
import * as t from '@babel/types'

export function component(path: NodePath, frame: string, addImportName: MParams['addImportName']) {
  if (
    !t.isCallExpression(path.parentPath.node) ||
    !(
      t.isArrowFunctionExpression(path.parentPath.node.arguments[0]) ||
      t.isFunctionExpression(path.parentPath.node.arguments[0])
    )
  ) {
    // Macros must be called directly, otherwise the correct call cannot be traced
    throw new Error(
      `'component' must be called directly and a function argument must be received, not a variable`
    )
  }

  switch (frame) {
    case Frame.react:
      {
        const nameId = addImportName('forwardRef', 'react')

        path.parentPath.replaceWith(t.callExpression(nameId, path.parentPath.node.arguments))
      }
      break
    case Frame.vue:
      {
        const { start, params } = path.parentPath.node.arguments[0]
        // Convert `return jsx` to `return () => jsx`
        path.parentPath.traverse({
          ReturnStatement(RPath) {
            if (RPath.getFunctionParent().node.start === start) {
              RPath.replaceWith(t.arrowFunctionExpression([], RPath.node.argument))
            }
          },
          JSXAttribute(JPath) {
            if (
              t.isIdentifier(params[1]) &&
              JPath.node.name.name === 'ref' &&
              JPath.node.value &&
              t.isJSXExpressionContainer(JPath.node.value) &&
              t.isIdentifier(JPath.node.value.expression) &&
              JPath.node.value.expression.name === params[1].name
            ) {
              JPath.remove()
            }
          }
        })

        // convert to `setup` object
        path.parentPath.replaceWith(
          t.objectExpression([
            t.objectProperty(t.identifier('inheritAttrs'), t.booleanLiteral(false)),
            t.objectMethod(
              'method',
              t.identifier('setup'),
              [
                t.identifier((path.parentPath.node.arguments[0].params[0] as t.Identifier).name),
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
      break
    case Frame.solid:
      path.parentPath.replaceWith(path.parentPath.node.arguments[0])
      break
    default:
      break
  }
}
