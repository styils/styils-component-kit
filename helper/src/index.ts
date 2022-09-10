export declare function state<T>(initialState: T): [T, <V extends T>(value: V) => void]

export declare function component<T>(component: T): T

export declare function ref<T>(initialRef: T): T

export declare function proper<T>(initialProps: T): T

export declare function useMount(func: Function): void

export declare function useMemo<Func extends (...args: any[]) => any>(func: Func): ReturnType<Func>

export declare function useWatchEffect(func: Function): void
