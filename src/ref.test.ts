import { getCode } from 'test'

describe('use ref', () => {
  it('base react', () => {
    const code = getCode(
      `
    import { ref } from 'macro'

    export default (props) => {
      const buttonRef = ref(null)

      buttonRef += 1

      return (
        <button ref={buttonRef}>
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
    import { ref } from 'macro'

    export default (props) => {
      let buttonRef = ref(0)

      buttonRef += 1

      return (
        <button ref={buttonRef}>
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
    import { ref } from 'macro'

    export default (props) => {
      let buttonRef = ref(0)

      buttonRef += 1

      return (
        <button ref={buttonRef}>
          Clicked {foo} {bar === 1 ? 'time' : 'times'}
        </button>
      )
    }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })
})
