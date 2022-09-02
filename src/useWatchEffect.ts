import type { NodePath } from '@babel/core'
import { MParams } from './types'
import * as t from '@babel/types'

export function useWatchEffect(path: NodePath, options: MParams, variableMaps: Set<string>) {
  const { opts, addImportName, currentCallExpression } = options

  switch (opts.frame) {
    case 'react':
      {
        const nameId = addImportName('useEffect', 'react')
        path.replaceWith(nameId)

        const deps = []
        currentCallExpression.traverse({
          Identifier(IPath) {
            if (variableMaps.has(IPath.node.name)) {
              deps.push(IPath.node)
            }
          }
        })

        currentCallExpression.node.arguments[1] = t.arrayExpression(deps)
        path.replaceWith(nameId)
      }
      break
    case 'vue':
      {
        const nameId = addImportName('watchEffect', 'vue')
        path.replaceWith(nameId)
      }
      break
    case 'solid':
      {
        const nameId = addImportName('createEffect', 'solid-js')
        path.replaceWith(nameId)
      }
      break
  }
}
