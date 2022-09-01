import type { NodePath } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'
import { MParams } from './types'
import * as t from '@babel/types'

export function useMemo(path: NodePath, options: MParams, idxMaps: Set<string>) {
  const { opts } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      {
        const hookId = addNamed(path, 'useMemo', 'react')
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
        const hookId = addNamed(path, 'computed', 'vue')
        path.replaceWith(hookId)
        path.parentPath.node.arguments[1] = null
      }
      break
    case 'solid':
      {
        const hookId = addNamed(path, 'createMemo', 'solid-js')
        path.replaceWith(hookId)
        path.parentPath.node.arguments[1] = null
      }
      break
  }
}
