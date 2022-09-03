import { createMacro } from 'babel-plugin-macros'
import * as t from '@babel/types'
import { addNamed } from '@babel/helper-module-imports'
import type { NodePath } from '@babel/traverse'
import type { MParams } from './types'
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

export default createMacro(({ references, state: babelState }) => {
  /**
   * used to get all props states
   * Used to get all props state, auto-populate react deps
   */
  const variableMaps = new Set([])
  const { component: Icomponent = [], proper: Iproper = [], ...macros } = references

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

  const macroStateMethods = [state, ref]

  macroStateMethods.forEach((macro) => {
    macros[macro.name]?.forEach((path) => {
      if (!t.isCallExpression(path.parentPath.node)) {
        // Macros must be called directly, otherwise the correct call cannot be traced
        throw new Error('All macros must be called')
      }

      const currentVariableDeclaration = path.findParent((p) =>
        t.isVariableDeclaration(p)
      ) as MParams['currentVariableDeclaration']

      const currentCallExpression = path.findParent((p) =>
        t.isCallExpression(p)
      ) as MParams['currentCallExpression']

      const currentFunction = path.getFunctionParent() as MParams['currentFunction']
      const currentVariableDeclarator = path.parentPath.parentPath.node

      const identifiers: NodePath<t.Identifier>[] = []
      const setIdentifiers: NodePath<t.CallExpression>[] = []

      if (t.isVariableDeclarator(currentVariableDeclarator)) {
        if (
          t.isIdentifier(currentVariableDeclarator.id) ||
          t.isArrayPattern(currentVariableDeclarator.id)
        ) {
          let identNodeName: { name: string; start: number } | undefined
          let setIdentNode: { name: string; start: number } | undefined

          if (t.isIdentifier(currentVariableDeclarator.id)) {
            identNodeName = {
              start: currentVariableDeclarator.id.start,
              name: currentVariableDeclarator.id.name
            }
          }

          if (
            t.isArrayPattern(currentVariableDeclarator.id) &&
            t.isIdentifier(currentVariableDeclarator.id.elements[0])
          ) {
            const [variable, setVariable] = currentVariableDeclarator.id.elements
            if (t.isIdentifier(variable)) {
              identNodeName = {
                start: variable.start,
                name: variable.name
              }
            }

            if (t.isIdentifier(setVariable)) {
              setIdentNode = {
                start: setVariable.start,
                name: setVariable.name
              }
            }
          }

          currentFunction.traverse({
            Identifier(IPath) {
              if (
                setIdentNode &&
                IPath.node.name === setIdentNode.name &&
                // exclude initialization nodes
                setIdentNode.start !== IPath.node.start &&
                // and new replacement nodes, new node without start
                IPath.node.start &&
                currentFunction.scope.hasOwnBinding(IPath.node.name) &&
                t.isCallExpression(IPath.parentPath)
              ) {
                // handling set methods
                setIdentifiers.push(IPath.parentPath as NodePath<t.CallExpression>)
              }

              if (
                identNodeName &&
                IPath.node.name === identNodeName.name &&
                // exclude initialization nodes
                identNodeName.start !== IPath.node.start &&
                // and new replacement nodes, new node without start
                IPath.node.start &&
                !t.isVariableDeclaration(IPath.parentPath.node) &&
                currentFunction.scope.hasOwnBinding(IPath.node.name)
              ) {
                // If it is an assignment expression
                // the current scope is saved
                // the assignment always precedes the use
                let scoper = IPath.scope

                while (scoper) {
                  if (scoper.hasOwnBinding(IPath.node.name)) {
                    if (scoper.block.start === path.scope.block.start) {
                      break
                    } else {
                      return
                    }
                  }

                  scoper = scoper.parent
                }

                const isRefJsxValue = IPath.findParent(
                  (item) =>
                    t.isJSXAttribute(item.node) &&
                    t.isJSXIdentifier(item.node.name) &&
                    item.node.name.name === 'ref'
                )

                if (!isRefJsxValue) {
                  identifiers.push(IPath)
                }
              }
            }
          })
        }
      }

      macro(
        path,
        {
          // `import .. form ..` helper method
          addImportName: createAddImportPath(path),
          currentFunction,
          currentCallExpression,
          currentVariableDeclaration,
          currentVariableDeclarator,
          identifiers,
          setIdentifiers,

          ...babelState
        },
        variableMaps
      )
    })
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
