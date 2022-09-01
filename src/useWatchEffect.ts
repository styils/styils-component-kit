import type { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function useWatchEffect(path: NodePath, options: MParams, idxMaps: Set<string>) {
  const { opts, addImportName } = options

  if (!t.isCallExpression(path.parentPath.node)) {
    return
  }

  switch (opts.frame) {
    case 'react':
      {
        const nameId = addImportName(path, 'useEffect', 'react')
        path.replaceWith(nameId)

        const deps = []
        path.parentPath.traverse({
          Identifier(IPath) {
            if (idxMaps.has(IPath.node.name)) {
              deps.push(IPath.node)
            }
          }
        })

        path.parentPath.node.arguments[1] = t.arrayExpression(deps)
        path.replaceWith(nameId)
      }
      break
    case 'vue':
      {
        const nameId = addImportName(path, 'watchEffect', 'vue')
        path.replaceWith(nameId)
      }
      break
    case 'solid':
      {
        const nameId = addImportName(path, 'createEffect', 'solid-js')
        path.replaceWith(nameId)
      }
      break
  }
}
