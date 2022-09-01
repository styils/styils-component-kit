import type { NodePath } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'
import { MParams } from './types'
import * as t from '@babel/types'

export function useMount(path: NodePath, options: MParams) {
  const { opts } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      {
        const hookId = addNamed(path, 'useEffect', 'react')

        path.replaceWith(hookId)
        path.parentPath.node.arguments.push(t.arrayExpression([]))
      }
      break
    case 'vue':
      {
        const hookId = addNamed(path, 'onMounted', 'vue')

        path.replaceWith(hookId)
      }
      break
    case 'solid':
      {
        const hookId = addNamed(path, 'onMount', 'solid-js')

        path.replaceWith(hookId)
      }
      break
  }
}
