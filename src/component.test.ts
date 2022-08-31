import { getCode } from '../tests'

describe('use component', () => {
  it('base vue', () => {
    const code = getCode(
      `
    import { component, proper } from 'macro'

    export default component((props) => {
      const {foo, bar, children, ...rest} = proper(props, {foo:1})

      return (
        <button {...rest}>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
          {children}
        </button>
      )
    })
    `,
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })

  it('vue not default props', () => {
    const code = getCode(
      `
    import { component, proper } from 'macro'

    export default component((props) => {
      const {foo, bar, children, ...rest} = proper(props)

      return (
        <button {...rest}>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
          {children}
        </button>
      )
    })
    `,
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })

  it('base react', () => {
    const code = getCode(
      `
    import { component, proper } from 'macro'

    export default component((props) => {
      const {foo, bar, ...rest} = proper(props)

      return (
        <button {...rest}>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
        </button>
      )
    })
    `,
      { frame: 'react' }
    )

    expect(code).toMatchSnapshot()
  })

  it('base solid', () => {
    const code = getCode(
      `
    import { component, proper } from 'macro'

    const button = component((props) => {
      const {foo, bar, ...rest} = proper(props)

      return (
        <button {...rest}>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
        </button>
      )
    })

    export default button
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })
})
