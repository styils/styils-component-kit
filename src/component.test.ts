import { getCode } from '../tests'

describe('use component', () => {
  it('base vue', () => {
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
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })
})
