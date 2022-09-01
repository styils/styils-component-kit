import { getCode } from 'test'

describe('macro state', () => {
  it('react base', () => {
    const code = getCode(
      `
    import { state } from 'macro'

    export default () => {
      const [count, setCount] = state(0)

      return (
        <button onClick={() => setCount(count + 1)}>
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
      import { state } from 'macro'

      export default function useHook() {
        const [v, setV] = state(false)

        const s = () => {
          setV(!v)
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
      import { state } from 'macro'

      export default () => {
        const [count, setCount] = state(0)

        function hello(){
          let count = 1
          count++
        }

        function foo(){
          count = 1
        }

        return (
          <button onClick={() => (setCount(count + 1))}>
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
      import { state } from 'macro'

      export default () => {
        const [count, setCount] = state({ a:1 })
        const [foo, setFoo] = state([1,2,3])

        function hello(){
          let count = 1
          count++
        }

        return (
          <button onClick={() => setCount({...count, a:count.a + 1})}>
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

  it('vue state arr', () => {
    const code = getCode(
      `
      import { state } from 'macro'

      export default () => {
        const [count, setCount] = state({ a:1 })
        const [foo, setFoo] = state([1,2,3])

        function hello(){
          let count = 1
          count++
        }

        return (
          <button onClick={() => setFoo([...count, count.a + 1])}>
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

  it('solid base', () => {
    const code = getCode(
      `
      import { state } from 'macro'

      export default () => {
        const [count, setCount] = state(0)

        function hello(){
          let count = 1
          count++
        }
        setCount(count++)

        return (
          <button onClick={() => setCount(count + 1)}>
            Clicked {count} {count === 1 ? 'time' : 'times'}
          </button>
        )
      }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })

  it('solid object', () => {
    const code = getCode(
      `
      import { state } from 'macro'

      export default () => {
        const [count, setCount] = state({a:1,b:2})

        return (
          <button onClick={() => setCount({...count, a: count.a + 1})}>
            Clicked {count.b} {count.a === 1 ? 'time' : 'times'}
          </button>
        )
      }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })

  it('solid batch', () => {
    const code = getCode(
      `
      import { state } from 'macro'

      export default () => {
        const [count, setCount] = state(0)

        const onClickA = () => {
          setCount()
        }

        const onClickB = function(){
          setCount()
          setCount()
        }

        function onClickC(foo){
          setCount(foo)
          setCount(foo)
        }

        return (
          <button onClick={() => {
            setCount(count + 1)
            setCount(count + 1)
          }}>
            <div onClick={onClickA}></div>
            <div onClick={onClickB}></div>
            <div onClick={onClickC}></div>
            <div onClick={()=> setCount(count + 1)}></div>
            Clicked {count} {count === 1 ? 'time' : 'times'}
          </button>
        )
      }
    `,
      { frame: 'solid' }
    )

    expect(code).toMatchSnapshot()
  })
})
