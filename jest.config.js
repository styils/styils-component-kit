/**
 * process.env.JEST_EASY from jest-easy
 * don't add collectCoverageFrom when using vscode plugin
 */
const path = require('path')

module.exports = {
  collectCoverageFrom: process.env.JEST_EASY
    ? (memo) => {
        return memo.concat(['!**/*.spec.{ts,tsx}', '!**/*.d.ts'])
      }
    : [],
  testMatch: [`**/?*.test.(j|t)s?(x)`],
  transform: {
    '^.+\\.(j|t)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021',
          paths: {
            test: [path.join(__dirname, 'test/')]
          }
        },
        sourceMaps: 'inline'
      }
    ]
  },
  testEnvironment: 'jest-environment-jsdom'
}
