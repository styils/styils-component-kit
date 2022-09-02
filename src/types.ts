import type { NodePath, PluginPass } from '@babel/core'
import type {
  ArrowFunctionExpression,
  CallExpression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  Node,
  ObjectMethod,
  VariableDeclaration
} from '@babel/types'

type Frame = 'vue' | 'react' | 'solid'

export interface MParams extends PluginPass {
  opts: {
    frame?: Frame
  }
  addImportName: (name: string, source: string) => Identifier
  currentVariableDeclaration?: NodePath<VariableDeclaration>
  currentCallExpression?: NodePath<CallExpression>
  currentVariableDeclarator?: Node
  currentFunction?: NodePath<
    FunctionDeclaration | FunctionExpression | ObjectMethod | ArrowFunctionExpression
  >
  setIdentifiers?: NodePath<CallExpression>[]
  identifiers?: NodePath<Identifier>[]
}
