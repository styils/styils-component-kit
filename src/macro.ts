import { createMacro } from 'babel-plugin-macros'
import { state as IState } from './state'
import { proper as IProper } from './proper'
import { component as IComponent } from './component'
import { ref as IRef } from './ref'

export declare function state<T>(initialState: T): T

export default createMacro(({ references, state }) => {
  if (references.component) references.component.forEach((path) => IComponent(path, state))

  if (references.state) references.state.forEach((path) => IState(path, state))

  if (references.ref) references.ref.forEach((path) => IRef(path, state))

  if (references.proper) references.proper.forEach((path) => IProper(path, state))
})
