import { getCode } from '../tests'

describe('use useMemo', () => {
  it('base vue', () => {
    const code = getCode(
      `
      import { useMemo, state } from 'macro'

      export default (props) => {
        const [count, setCount] = state(0)
        const value = useMemo(() => {
          return count
        })

        return (
          <button>
            {value}
          </button>
        )
      }
    `,
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })

  it('base react', () => {
    const code = getCode(
      `
      import { useMemo, state } from 'macro'

      export default (props) => {
        const [count, setCount] = state(0)
        const value = useMemo(() => {
          return count
        })

        return (
          <button>
            {value}
          </button>
        )
      }
    `,
      { frame: 'react' }
    )

    expect(code).toMatchSnapshot()
  })

  it('base solid', () => {
    const code = getCode(
      `
    import { useMemo } from 'macro'

    export default (props) => {
      const value = useMemo(() => {
        return 'foo'
      })

      return (
        <button>
          {value}
        </button>
      )
    }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })
})
