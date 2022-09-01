import type { NodePath, PluginPass } from '@babel/core'
import type { Identifier } from '@babel/types'

export interface MParams extends PluginPass {
  opts: {
    frame?: 'vue' | 'react' | 'solid'
  }
  addImportName: (path: NodePath, name: string, source: string) => Identifier
}
