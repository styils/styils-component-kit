import { getCode } from 'test'

describe('use useMount', () => {
  it('base vue', () => {
    const code = getCode(
      `
    import { useMount } from 'macro'

    export default (props) => {
      useMount(() => {
        console.log('hello')
      })

      return (
        <button>
          Clicked
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
    import { useMount } from 'macro'

    export default (props) => {
      useMount(() => {
        console.log('hello')
      })

      return (
        <button>
          Clicked
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
    import { useMount } from 'macro'

    export default (props) => {
      useMount(() => {
        console.log('hello')
      })

      return (
        <button>
          Clicked
        </button>
      )
    }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })
})
