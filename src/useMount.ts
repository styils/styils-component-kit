import type { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function useMount(path: NodePath, options: MParams) {
  const { opts, addImportName } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      {
        const nameId = addImportName(path, 'useEffect', 'react')

        path.replaceWith(nameId)
        path.parentPath.node.arguments.push(t.arrayExpression([]))
      }
      break
    case 'vue':
      {
        const nameId = addImportName(path, 'onMounted', 'vue')

        path.replaceWith(nameId)
      }
      break
    case 'solid':
      {
        const nameId = addImportName(path, 'onMount', 'solid-js')

        path.replaceWith(nameId)
      }
      break
  }
}
