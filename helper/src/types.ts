import type { NodePath, PluginPass } from '@babel/core'
import * as t from '@babel/types'

export enum Frame {
  vue = 'vue',
  react = 'react',
  solid = 'solid'
}

export interface MParams extends PluginPass {
  opts: {
    frame?: Frame
  }
  addImportName: (name: string, source: string) => t.Identifier
  currentCallExpression?: NodePath<t.CallExpression>
}
