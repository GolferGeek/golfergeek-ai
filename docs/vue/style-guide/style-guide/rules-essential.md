# Priority A Rules: Essential {#priority-a-rules-essential}

::: warning Note
This Vue.js Style Guide is outdated and needs to be reviewed. If you have any questions or suggestions, please [open an issue](https://github.com/vuejs/docs/issues/new).
:::

These rules help prevent errors, so learn and abide by them at all costs. Exceptions may exist, but should be very rare and only be made by those with expert knowledge of both JavaScript and Vue.

## Use multi-word component names {#use-multi-word-component-names}

User component names should always be multi-word, except for root `App` components. This [prevents conflicts](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name) with existing and future HTML elements, since all HTML elements are a single word.

<h3>Bad</h3>

```vue-html

<Item />

<item></item>
```

<h3>Good</h3>

```vue-html

<TodoItem />

<todo-item></todo-item>
```

## Use detailed prop definitions {#use-detailed-prop-definitions}

In committed code, prop definitions should always be as detailed as possible, specifying at least type(s).

::: details Detailed Explanation
Detailed [prop definitions](/guide/components/props#prop-validation) have two advantages:

- They document the API of the component, so that it's easy to see how the component is meant to be used.
- In development, Vue will warn you if a component is ever provided incorrectly formatted props, helping you catch potential sources of error.
  :::

<h3>Bad</h3>

```js
// This is only OK when prototyping
props: ['status']
```

<h3>Good</h3>

```js
props: {
  status: String
}
```

```js
// Even better!
props: {
  status: {
    type: String,
    required: true,

    validator: value => {
      return [
        'syncing',
        'synced',
        'version-conflict',
        'error'
      ].includes(value)
    }
  }
}
```

<h3>Bad</h3>

```js
// This is only OK when prototyping
const props = defineProps(['status'])
```

<h3>Good</h3>

```js
const props = defineProps({
  status: String
})
```

```js
// Even better!

const props = defineProps({
  status: {
    type: String,
    required: true,

    validator: (value) => {
      return ['syncing', 'synced', 'version-conflict', 'error'].includes(
        value
      )
    }
  }
})
```

## Use keyed `v-for` {#use-keyed-v-for}

`key` with `v-for` is _always_ required on components, in order to maintain internal component state down the subtree. Even for elements though, it's a good practice to maintain predictable behavior, such as [object constancy](https://bost.ocks.org/mike/constancy/) in animations.

::: details Detailed Explanation
Let's say you have a list of todos:

```js
data() {
  return {
    todos: [
      {
        id: 1,
        text: 'Learn to use v-for'
      },
      {
        id: 2,
        text: 'Learn to use key'
      }
    ]
  }
}
```

```js
const todos = ref([
  {
    id: 1,
    text: 'Learn to use v-for'
  },
  {
    id: 2,
    text: 'Learn to use key'
  }
])
```

Then you sort them alphabetically. When updating the DOM, Vue will optimize rendering to perform the cheapest DOM mutations possible. That might mean deleting the first todo element, then adding it again at the end of the list.

The problem is, there are cases where it's important not to delete elements that will remain in the DOM. For example, you may want to use `<transition-group>` to animate list sorting, or maintain focus if the rendered element is an `<input>`. In these cases, adding a unique key for each item (e.g. `:key="todo.id"`) will tell Vue how to behave more predictably.

In our experience, it's better to _always_ add a unique key, so that you and your team simply never have to worry about these edge cases. Then in the rare, performance-critical scenarios where object constancy isn't necessary, you can make a conscious exception.
:::

<h3>Bad</h3>

```vue-html
<ul>
  <li v-for="todo in todos">
    {{ todo.text }}
  </li>
</ul>
```

<h3>Good</h3>

```vue-html
<ul>
  <li
    v-for="todo in todos"
    :key="todo.id"
  >
    {{ todo.text }}
  </li>
</ul>
```

## Avoid `v-if` with `v-for` {#avoid-v-if-with-v-for}

**Never use `v-if` on the same element as `v-for`.**

There are two common cases where this can be tempting:

- To filter items in a list (e.g. `v-for="user in users" v-if="user.isActive"`). In these cases, replace `users` with a new computed property that returns your filtered list (e.g. `activeUsers`).

- To avoid rendering a list if it should be hidden (e.g. `v-for="user in users" v-if="shouldShowUsers"`). In these cases, move the `v-if` to a container element (e.g. `ul`, `ol`).

::: details Detailed Explanation
When Vue processes directives, `v-if` has a higher priority than `v-for`, so that this template:

```vue-html
<ul>
  <li
    v-for="user in users"
    v-if="user.isActive"
    :key="user.id"
  >
    {{ user.name }}
  </li>
</ul>
```

Will throw an error, because the `v-if` directive will be evaluated first and the iteration variable `user` does not exist at this moment.

This could be fixed by iterating over a computed property instead, like this:

```js
computed: {
  activeUsers() {
    return this.users.filter(user => user.isActive)
  }
}
```

```js
const activeUsers = computed(() => {
  return users.filter((user) => user.isActive)
})
```

```vue-html
<ul>
  <li
    v-for="user in activeUsers"
    :key="user.id"
  >
    {{ user.name }}
  </li>
</ul>
```

Alternatively, we can use a `<template>` tag with `v-for` to wrap the `<li>` element:

```vue-html
<ul>
  <template v-for="user in users" :key="user.id">
    <li v-if="user.isActive">
      {{ user.name }}
    </li>
  </template>
</ul>
```

:::

<h3>Bad</h3>

```vue-html
<ul>
  <li
    v-for="user in users"
    v-if="user.isActive"
    :key="user.id"
  >
    {{ user.name }}
  </li>
</ul>
```

<h3>Good</h3>

```vue-html
<ul>
  <li
    v-for="user in activeUsers"
    :key="user.id"
  >
    {{ user.name }}
  </li>
</ul>
```

```vue-html
<ul>
  <template v-for="user in users" :key="user.id">
    <li v-if="user.isActive">
      {{ user.name }}
    </li>
  </template>
</ul>
```

## Use component-scoped styling {#use-component-scoped-styling}

For applications, styles in a top-level `App` component and in layout components may be global, but all other components should always be scoped.

This is only relevant for [Single-File Components](/guide/scaling-up/sfc). It does _not_ require that the [`scoped` attribute](https://vue-loader.vuejs.org/guide/scoped-css.html) be used. Scoping could be through [CSS modules](https://vue-loader.vuejs.org/guide/css-modules.html), a class-based strategy such as [BEM](http://getbem.com/), or another library/convention.

**Component libraries, however, should prefer a class-based strategy instead of using the `scoped` attribute.**

This makes overriding internal styles easier, with human-readable class names that don't have too high specificity, but are still very unlikely to result in a conflict.

::: details Detailed Explanation
If you are developing a large project, working with other developers, or sometimes include 3rd-party HTML/CSS (e.g. from Auth0), consistent scoping will ensure that your styles only apply to the components they are meant for.

Beyond the `scoped` attribute, using unique class names can help ensure that 3rd-party CSS does not apply to your own HTML. For example, many projects use the `button`, `btn`, or `icon` class names, so even if not using a strategy such as BEM, adding an app-specific and/or component-specific prefix (e.g. `ButtonClose-icon`) can provide some protection.
:::

<h3>Bad</h3>

```vue-html
<template>
  <button class="btn btn-close">×</button>
</template>

<style>
.btn-close {
  background-color: red;
}
</style>
```

<h3>Good</h3>

```vue-html
<template>
  <button class="button button-close">×</button>
</template>

<style scoped>
.button {
  border: none;
  border-radius: 2px;
}

.button-close {
  background-color: red;
}
</style>
```

```vue-html
<template>
  <button :class="[$style.button, $style.buttonClose]">×</button>
</template>

<style module>
.button {
  border: none;
  border-radius: 2px;
}

.buttonClose {
  background-color: red;
}
</style>
```

```vue-html
<template>
  <button class="c-Button c-Button--close">×</button>
</template>

<style>
.c-Button {
  border: none;
  border-radius: 2px;
}

.c-Button--close {
  background-color: red;
}
</style>
```

