import { getCode } from 'test'

describe('use useWatchEffect', () => {
  it('base vue', () => {
    const code = getCode(
      `
    import { useWatchEffect } from 'macro'

    export default (props) => {
      useWatchEffect(() => {
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
    import { useWatchEffect, proper } from 'macro'

    export default (props) => {
      const { foo } = proper(props)
      useWatchEffect(() => {
        console.log(foo)
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
    import { useWatchEffect } from 'macro'

    export default (props) => {
      useWatchEffect(() => {
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
