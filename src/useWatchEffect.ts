import type { NodePath } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'
import { MParams } from './types'
import * as t from '@babel/types'

export function useWatchEffect(path: NodePath, options: MParams, idxMaps: Set<string>) {
  const { opts } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      {
        const hookId = addNamed(path, 'useEffect', 'react')
        path.replaceWith(hookId)

        const deps = []
        path.parentPath.traverse({
          Identifier(IPath) {
            if (idxMaps.has(IPath.node.name)) {
              deps.push(IPath.node)
            }
          }
        })

        path.parentPath.node.arguments[1] = t.arrayExpression(deps)
        path.replaceWith(hookId)
      }
      break
    case 'vue':
      {
        const hookId = addNamed(path, 'watchEffect', 'vue')
        path.replaceWith(hookId)
      }
      break
    case 'solid':
      {
        const hookId = addNamed(path, 'createEffect', 'solid-js')
        path.replaceWith(hookId)
      }
      break
  }
}
