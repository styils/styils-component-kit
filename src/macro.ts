import { createMacro } from 'babel-plugin-macros'
import * as t from '@babel/types'
import { addNamed } from '@babel/helper-module-imports'
import type { NodePath } from '@babel/core'
import { component } from './component'
import { state } from './state'
import { proper } from './proper'
import { ref } from './ref'
import { useMount } from './useMount'
import { useMemo } from './useMemo'
import { useWatchEffect } from './useWatchEffect'

/**
 * Avoid importing multiple identical methods
 */
const hookCacheId = new Map()

export default createMacro(({ references, state: babelState, babel }) => {
  /**
   * used to get all props states
   * Used to get all props state, auto-populate react deps
   */
  const idxMaps = new Set([])

  const options = {
    // `import .. form ..` helper method
    addImportName: (path: NodePath, name: string, source: string) => {
      const cacheCode = babelState.file.code + name

      const nameId = hookCacheId.get(cacheCode) ?? addNamed(path, name, source)
      hookCacheId.set(cacheCode, nameId)

      return nameId
    },
    ...babelState
  }

  // Idenifier needs to be obtained so the order is fixed
  const macros = [component, state, proper, ref, useMount, useMemo, useWatchEffect]

  macros.forEach((macro) => {
    references[macro.name]?.forEach((path) => {
      if (!babel.types.isCallExpression(path.parentPath.node)) {
        return
      }

      macro(path, options, idxMaps)
    })
  })
})
