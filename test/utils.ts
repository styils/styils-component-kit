import { transformSync } from '@babel/core'
import { format } from 'prettier'
import path from 'path'

export function getCode(code: string, options: Record<string, any> = {}) {
  code = code.replace("'macro'", JSON.stringify(path.join(__dirname, '..', 'src', 'macro')))
  return format(
    transformSync(code, {
      plugins: [['macros', options]],
      parserOpts: {
        plugins: ['jsx']
      }
    })?.code ?? '',
    { parser: 'babel' }
  )
}
