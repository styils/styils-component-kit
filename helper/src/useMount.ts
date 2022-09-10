import type { NodePath } from '@babel/core'
import { MParams, Frame } from './types'
import * as t from '@babel/types'

export function useMount(path: NodePath, options: MParams) {
  const { opts, addImportName, currentCallExpression } = options

  switch (opts.frame) {
    case Frame.react:
      {
        const nameId = addImportName('useEffect', 'react')

        path.replaceWith(nameId)
        currentCallExpression.node.arguments.push(t.arrayExpression([]))
      }
      break
    case Frame.vue:
      {
        const nameId = addImportName('onMounted', 'vue')

        path.replaceWith(nameId)
      }
      break
    case Frame.solid:
      {
        const nameId = addImportName('onMount', 'solid-js')

        path.replaceWith(nameId)
      }
      break
  }
}
