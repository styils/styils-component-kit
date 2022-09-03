import { getCode } from 'test'

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

  it('react merge props', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo, bar} = proper(props, {foo:1})

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

      function onclick(){
        let foo = 0

        if (a == 1){
          if (b == 2){
            foo++
          }
        }
      }

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

  it('vue merge props', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo, bar} = proper(props, {foo:1})

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

  it('vue scope proper', () => {
    const code = getCode(
      `
      import { proper } from 'macro'

      export default (props) => {
        const {foo:foo1, bar, ...rest} = proper(props, {foo:'1'})

        function onclick(){
          let foo1 = 0

          if (a == 1){
            if (b == 2){
              foo1++
            }
          }
        }

        function onclick1(){
          foo1++

          if (a == 1){
            let foo1 = 0
            if (b == 2){
              foo1++
            }
          }
        }

        return (
          <button {...rest}>
            Clicked {foo1} {bar === 1 ? 'time' : 'times'}
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

  it('solid merge props', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo:foo1, bar, ...rest} = proper(props, {foo:'1'})

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

  it('solid scope proper', () => {
    const code = getCode(
      `
    import { proper } from 'macro'

    export default (props) => {
      const {foo:foo1, bar, ...rest} = proper(props, {foo:'1'})

      function onclick(){
        let foo1 = 0

        if (a == 1){
          if (b == 2){
            foo1++
          }
        }
      }

      function onclick1(){
        foo1++

        if (a == 1){
          let foo1 = 0
          if (b == 2){
            foo1++
          }
        }
      }

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
