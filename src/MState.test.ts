import { getCode } from '../tests'

describe('macro state', () => {
  it('react base', () => {
    const code = getCode(
      `
    import { MState } from 'macro'

    export default () => {
      let count = MState(0)

      return (
        <button onClick={() => (count += 1)}>
          Clicked {count} {count === 1 ? 'time' : 'times'}
        </button>
      )
    }
    `,
      { frame: 'react' }
    )

    expect(code).toMatchSnapshot()
  })

  it('react hook', () => {
    const code = getCode(
      `
      import { MState } from 'macro'

      export default function useHook() {
        let v = MState(false)

        const s = () => {
          v = !v
        }

        return [v, s]
      }
    `,
      { frame: 'react' }
    )

    expect(code).toMatchSnapshot()
  })

  it('vue base', () => {
    const code = getCode(
      `
      import { MState } from 'macro'

      export default () => {
        let count = MState(0)

        function hello(){
          let count = 1
          count++
        }

        return (
          <button onClick={() => (count += 1)}>
            Clicked {count} {count === 1 ? 'time' : 'times'}
          </button>
        )
      }
    `,
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })

  it('vue state object', () => {
    const code = getCode(
      `
      import { MState } from 'macro'

      export default () => {
        const count = MState({ a:1 })
        const foo = MState([1,2,3])

        function hello(){
          let count = 1
          count++
        }

        return (
          <button onClick={() => (count.a += 1)}>
            Clicked {count.a} {count.a === 1 ? 'time' : 'times'}
            {foo.map((i)=> <span>{i}</span>)}
          </button>
        )
      }
    `,
      { frame: 'vue' }
    )

    expect(code).toMatchSnapshot()
  })
})
