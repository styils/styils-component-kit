import type { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function useMount(path: NodePath, options: MParams) {
  const { opts, addImportName, currentCallExpression } = options

  switch (opts.frame) {
    case 'react':
      {
        const nameId = addImportName('useEffect', 'react')

        path.replaceWith(nameId)
        currentCallExpression.node.arguments.push(t.arrayExpression([]))
      }
      break
    case 'vue':
      {
        const nameId = addImportName('onMounted', 'vue')

        path.replaceWith(nameId)
      }
      break
    case 'solid':
      {
        const nameId = addImportName('onMount', 'solid-js')

        path.replaceWith(nameId)
      }
      break
  }
}
