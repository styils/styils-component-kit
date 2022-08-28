import { createMacro } from 'babel-plugin-macros'
import { MState } from './MState'
import { MProps } from './MProps'

export declare function state<T>(initialState: T): T

export default createMacro(({ references, state }) => {
  if (references.MState) references.MState.forEach((path) => MState(path, state))

  if (references.MProps) references.MProps.forEach((path) => MProps(path, state))
})
