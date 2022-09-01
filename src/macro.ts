import { createMacro } from 'babel-plugin-macros'
import { state as IState } from './state'
import { proper as IProper } from './proper'
import { component as IComponent } from './component'
import { ref as IRef } from './ref'
import { useMount as IUseMounted } from './useMount'
import { useMemo as IUseMemo } from './useMemo'
import { useWatchEffect as IUseWatchEffect } from './useWatchEffect'

export declare function state<T>(initialState: T): [T, <V extends T>(value: V) => void]

export declare function component<T>(component: T): T

export declare function ref<T>(initialRef: T): T

export declare function proper<T>(initialProps: T): T

export declare function useMount(func: Function): void

export declare function useMemo<Func extends (...args: any[]) => any>(func: Func): ReturnType<Func>

export declare function useWatchEffect(func: Function): void

export default createMacro(({ references, state }) => {
  const idxMaps = new Set([])

  if (references.component) references.component.forEach((path) => IComponent(path, state))

  if (references.state) references.state.forEach((path) => IState(path, state, idxMaps))

  if (references.ref) references.ref.forEach((path) => IRef(path, state))

  if (references.proper) references.proper.forEach((path) => IProper(path, state, idxMaps))

  if (references.useMount) references.useMount.forEach((path) => IUseMounted(path, state))

  if (references.useMemo) references.useMemo.forEach((path) => IUseMemo(path, state, idxMaps))

  if (references.useWatchEffect)
    references.useWatchEffect.forEach((path) => IUseWatchEffect(path, state, idxMaps))
})
