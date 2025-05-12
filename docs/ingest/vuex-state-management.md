# Vuex State Management Guide

## Introduction to Vuex

Vuex is a state management pattern and library for Vue.js applications. It serves as a centralized store for all the components in an application, with rules ensuring that the state can only be mutated in a predictable fashion. Vuex integrates with Vue's official devtools extension to provide advanced features such as zero-config time-travel debugging and state snapshot import/export.

### When to Use Vuex

Vuex helps manage shared state across components in medium to large-scale Vue applications. It's particularly useful when:

- Multiple components rely on the same state
- Actions from different components may need to mutate the same state
- You need a single source of truth for application state
- You want to maintain a clear, traceable pattern for state modifications

## Core Concepts

### State

The single state tree that serves as the "single source of truth" for your application:

```js
const store = createStore({
  state() {
    return {
      count: 0,
      todos: [
        { id: 1, text: 'Learn Vue', done: true },
        { id: 2, text: 'Learn Vuex', done: false }
      ]
    }
  }
})
```

Access state in components:

```js
// In a component
computed: {
  count() {
    return this.$store.state.count
  }
}
```

### Getters

Getters allow you to compute derived state based on store state. They are like computed properties for stores:

```js
const store = createStore({
  state() {
    return {
      todos: [
        { id: 1, text: 'Learn Vue', done: true },
        { id: 2, text: 'Learn Vuex', done: false }
      ]
    }
  },
  getters: {
    doneTodos(state) {
      return state.todos.filter(todo => todo.done)
    },
    doneTodosCount(state, getters) {
      return getters.doneTodos.length
    }
  }
})
```

Access getters in components:

```js
computed: {
  doneTodosCount() {
    return this.$store.getters.doneTodosCount
  }
}
```

### Mutations

Mutations are the only way to change state in a Vuex store. Each mutation has a string type and a handler function:

```js
const store = createStore({
  state() {
    return {
      count: 0
    }
  },
  mutations: {
    increment(state) {
      state.count++
    },
    incrementBy(state, payload) {
      state.count += payload.amount
    }
  }
})
```

Commit mutations:

```js
// Call a mutation
store.commit('increment')

// With payload
store.commit('incrementBy', { amount: 10 })
```

### Actions

Actions are similar to mutations, but:
- Actions commit mutations instead of directly mutating state
- Actions can contain asynchronous operations

```js
const store = createStore({
  state() {
    return {
      count: 0
    }
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    incrementAsync(context) {
      setTimeout(() => {
        context.commit('increment')
      }, 1000)
    },
    async fetchData({ commit }) {
      try {
        const data = await api.getData()
        commit('setData', data)
      } catch (error) {
        commit('setError', error)
      }
    }
  }
})
```

Dispatch actions:

```js
// Dispatch an action
store.dispatch('incrementAsync')

// With payload
store.dispatch('fetchData', { id: 123 })
```

### Modules

For large applications, Vuex allows dividing the store into modules. Each module can have its own state, mutations, actions, getters, and even nested modules:

```js
const moduleA = {
  state() { return { ... } },
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state() { return { ... } },
  mutations: { ... },
  actions: { ... }
}

const store = createStore({
  modules: {
    a: moduleA,
    b: moduleB
  }
})
```

Access module state:

```js
store.state.a // -> moduleA's state
store.state.b // -> moduleB's state
```

## Usage with Vue Components

### The `mapState` Helper

```js
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      count: state => state.count,
      countAlias: 'count', // shorthand for state => state.count
      countPlusLocalState(state) {
        return state.count + this.localCount
      }
    })
  }
}
```

### The `mapGetters` Helper

```js
import { mapGetters } from 'vuex'

export default {
  computed: {
    // map this.doneCount to store.getters.doneTodosCount
    ...mapGetters(['doneTodosCount', 'anotherGetter'])
  }
}
```

### The `mapMutations` Helper

```js
import { mapMutations } from 'vuex'

export default {
  methods: {
    ...mapMutations([
      'increment', // map this.increment() to this.$store.commit('increment')
      'incrementBy' // map this.incrementBy(amount) to this.$store.commit('incrementBy', amount)
    ]),
    ...mapMutations({
      add: 'increment' // map this.add() to this.$store.commit('increment')
    })
  }
}
```

### The `mapActions` Helper

```js
import { mapActions } from 'vuex'

export default {
  methods: {
    ...mapActions([
      'increment', // map this.increment() to this.$store.dispatch('increment')
      'incrementBy' // map this.incrementBy(amount) to this.$store.dispatch('incrementBy', amount)
    ]),
    ...mapActions({
      add: 'increment' // map this.add() to this.$store.dispatch('increment')
    })
  }
}
```

## Advanced Patterns

### Module Namespacing

For complex applications with many modules, you can enable namespacing to avoid naming conflicts:

```js
const store = createStore({
  modules: {
    account: {
      namespaced: true,
      // module assets
      state() { return { ... } }, // module state is already nested and not affected by namespace option
      getters: {
        isAdmin() { ... } // -> getters['account/isAdmin']
      },
      actions: {
        login() { ... } // -> dispatch('account/login')
      },
      mutations: {
        login() { ... } // -> commit('account/login')
      },
      // nested modules
      modules: {
        // inherits the namespace from parent module
        myPage: {
          state() { return { ... } },
          getters: {
            profile() { ... } // -> getters['account/profile']
          }
        }
      }
    }
  }
})
```

### Using with the Composition API

Vuex 4 is compatible with Vue 3's Composition API:

```js
import { useStore } from 'vuex'
import { computed } from 'vue'

export default {
  setup() {
    const store = useStore()
    
    // Access state
    const count = computed(() => store.state.count)
    
    // Access getters
    const doneTodosCount = computed(() => store.getters.doneTodosCount)
    
    // Use mutations
    function increment() {
      store.commit('increment')
    }
    
    // Use actions
    function incrementAsync() {
      store.dispatch('incrementAsync')
    }
    
    return {
      count,
      doneTodosCount,
      increment,
      incrementAsync
    }
  }
}
```

## Best Practices

1. **Use actions for async operations**: Mutations should be synchronous, use actions for API calls and other async operations
2. **Keep state serializable**: Store only data that can be serialized in JSON
3. **Organize by domain**: Structure your store around business domains rather than component structure
4. **Use modules for large applications**: Divide your store into modules to keep it manageable
5. **Use constants for mutation types**: To avoid typos and give you linting/IDE support
6. **Avoid directly changing state**: Always use mutations to change state, even in development
7. **Keep mutations simple**: Mutations should be simple and straightforward
8. **Form handling**: Use two-way binding helpers for working with forms

## Plugins and Extensions

Vuex supports plugins that can observe and react to state changes:

```js
const myPlugin = store => {
  // called when the store is initialized
  store.subscribe((mutation, state) => {
    // called after every mutation
    console.log(mutation.type)
    console.log(mutation.payload)
  })
}

const store = createStore({
  // ...
  plugins: [myPlugin]
})
```

Common plugins include:
- Logger plugin
- Persistence plugin
- State synchronization between tabs
- DevTools plugin

## Testing

Testing Vuex stores, especially mutations and actions, can be straightforward due to their functional nature:

```js
// Testing a mutation
import { mutations } from './store'

const { increment } = mutations

const state = { count: 0 }
increment(state)
expect(state.count).toBe(1)

// Testing an action
import { actions } from './store'

const testAction = async (action, payload, state, expectedMutations) => {
  let count = 0
  const commit = (type, payload) => {
    const mutation = expectedMutations[count]
    expect(type).toBe(mutation.type)
    if (payload) {
      expect(payload).toEqual(mutation.payload)
    }
    count++
  }
  await action({ commit, state }, payload)
  expect(count).toBe(expectedMutations.length)
}

it('incrementAsync', async () => {
  await testAction(actions.incrementAsync, null, {}, [
    { type: 'increment' }
  ])
})
``` 