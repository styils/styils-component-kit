import { createMacro } from 'babel-plugin-macros'
import * as t from '@babel/types'
import { addNamed } from '@babel/helper-module-imports'
import type { NodePath } from '@babel/traverse'
import type { MParams } from './types'
import { component } from './component'
import { state } from './state'
import { proper } from './proper'
import { useMount } from './useMount'
import { useMemo } from './useMemo'
import { useWatchEffect } from './useWatchEffect'

/**
 * Avoid importing multiple identical methods
 */
const hookCacheId = new Map()

export default createMacro(({ references, state: babelState }) => {
  /**
   * used to get all props states
   * Used to get all props state, auto-populate react deps
   */
  const variableMaps = new Set([])
  const {
    component: Icomponent = [],
    proper: Iproper = [],
    state: Istate = [],
    ...macros
  } = references

  const createAddImportPath = (path: NodePath) => (name: string, source: string) => {
    const cacheCode = babelState.file.code + name

    const nameId = hookCacheId.get(cacheCode) ?? addNamed(path, name, source)
    hookCacheId.set(cacheCode, nameId)

    return nameId
  }

  // component always stays first
  Icomponent.forEach((path) => {
    component(path, (babelState.opts as { frame: string }).frame, createAddImportPath(path))
  })

  Iproper.forEach((path) => {
    proper(path, { addImportName: createAddImportPath(path), ...babelState }, variableMaps)
  })

  Istate.forEach((path) => {
    state(path, { addImportName: createAddImportPath(path), ...babelState }, variableMaps)
  })

  const macroHookMethods = [useMount, useMemo, useWatchEffect]

  macroHookMethods.forEach((macro) => {
    macros[macro.name]?.forEach((path) => {
      if (!t.isCallExpression(path.parentPath.node)) {
        // Macros must be called directly, otherwise the correct call cannot be traced
        throw new Error('All macros must be called')
      }

      const currentCallExpression = path.findParent((p) =>
        t.isCallExpression(p)
      ) as MParams['currentCallExpression']

      macro(
        path,
        {
          currentCallExpression,
          ...babelState, // `import .. form ..` helper method
          addImportName: createAddImportPath(path)
        },
        variableMaps
      )
    })
  })
})
