import { createMacro } from 'babel-plugin-macros'
import { state as IState } from './state'
import { proper as IProper } from './proper'

export declare function state<T>(initialState: T): T

export default createMacro(({ references, state }) => {
  if (references.state) references.state.forEach((path) => IState(path, state))

  if (references.proper) references.proper.forEach((path) => IProper(path, state))
})
