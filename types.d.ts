declare module '@babel/helper-module-imports' {
  function addNamed(
    path: import('@babel/core').NodePath,
    name: string,
    source: string
  ): import('@babel/types').Identifier
}
