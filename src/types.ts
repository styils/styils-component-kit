import { PluginPass } from '@babel/core'

export interface MParams extends PluginPass {
  opts: {
    frame?: 'vue' | 'react' | 'solid'
  }
}
