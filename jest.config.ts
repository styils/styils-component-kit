/**
 * process.env.JEST_EASY from jest-easy
 * don't add collectCoverageFrom when using vscode plugin
 */
import { Config } from '@jest/types'

export default <Config.InitialOptions>{
  collectCoverageFrom: process.env.JEST_EASY
    ? (memo: string[]) => {
        return memo.concat(['!**/*.spec.{ts,tsx}', '!**/*.d.ts'])
      }
    : [],
  testMatch: [`**/?*.test.(j|t)s?(x)`],
  transform: {
    '^.+\\.(j|t)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021'
        },
        sourceMaps: 'inline'
      }
    ]
  },
  testEnvironment: 'jest-environment-jsdom'
}
