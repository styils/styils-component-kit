import { getCode } from '../tests'

describe('use props', () => {
  it('base react', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo, bar} = proper(props)

      return (
        <button>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
        </button>
      )
    }
    `,
      { frame: 'react' }
    )

    expect(code).toMatchSnapshot()
  })

  it('base vue', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo, bar} = proper(props)

      return (
        <button>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
        </button>
      )
    }
    `,
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })

  it('base solid', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo:foo1, bar, ...rest} = proper(props)

      return (
        <button {...rest}>
          Clicked {foo1} {bar === 1 ? 'time' : 'times'}
        </button>
      )
    }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })
})
