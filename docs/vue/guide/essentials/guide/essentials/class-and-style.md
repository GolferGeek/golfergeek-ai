# Class and Style Bindings {#class-and-style-bindings}

A common need for data binding is manipulating an element's class list and inline styles. Since `class` and `style` are both attributes, we can use `v-bind` to assign them a string value dynamically, much like with other attributes. However, trying to generate those values using string concatenation can be annoying and error-prone. For this reason, Vue provides special enhancements when `v-bind` is used with `class` and `style`. In addition to strings, the expressions can also evaluate to objects or arrays.

## Binding HTML Classes {#binding-html-classes}

### Binding to Objects {#binding-to-objects}

We can pass an object to `:class` (short for `v-bind:class`) to dynamically toggle classes:

```vue-html
<div :class="{ active: isActive }">
```

The above syntax means the presence of the `active` class will be determined by the [truthiness](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) of the data property `isActive`.

You can have multiple classes toggled by having more fields in the object. In addition, the `:class` directive can also co-exist with the plain `class` attribute. So given the following state:

```js
const isActive = ref(true)
const hasError = ref(false)
```

```js
data() {
  return {
    isActive: true,
    hasError: false
  }
}
```

And the following template:

```vue-html
<div
  class="static"
  :class="{ active: isActive, 'text-danger': hasError }"
>
```

It will render:

```vue-html

```

When `isActive` or `hasError` changes, the class list will be updated accordingly. For example, if `hasError` becomes `true`, the class list will become `"static active text-danger"`.

The bound object doesn't have to be inline:

```js
const classObject = reactive({
  active: true,
  'text-danger': false
})
```

```js
data() {
  return {
    classObject: {
      active: true,
      'text-danger': false
    }
  }
}
```

```vue-html
<div :class="classObject">
```

This will render:

```vue-html

```

We can also bind to a [computed property](./computed) that returns an object. This is a common and powerful pattern:

```js
const isActive = ref(true)
const error = ref(null)

const classObject = computed(() => ({
  active: isActive.value && !error.value,
  'text-danger': error.value && error.value.type === 'fatal'
}))
```

```js
data() {
  return {
    isActive: true,
    error: null
  }
},
computed: {
  classObject() {
    return {
      active: this.isActive && !this.error,
      'text-danger': this.error && this.error.type === 'fatal'
    }
  }
}
```

```vue-html
<div :class="classObject">
```

### Binding to Arrays {#binding-to-arrays}

We can bind `:class` to an array to apply a list of classes:

```js
const activeClass = ref('active')
const errorClass = ref('text-danger')
```

```js
data() {
  return {
    activeClass: 'active',
    errorClass: 'text-danger'
  }
}
```

```vue-html
<div :class="[activeClass, errorClass]">
```

Which will render:

```vue-html

```

If you would like to also toggle a class in the list conditionally, you can do it with a ternary expression:

```vue-html
<div :class="[isActive ? activeClass : '', errorClass]">
```

This will always apply `errorClass`, but `activeClass` will only be applied when `isActive` is truthy.

However, this can be a bit verbose if you have multiple conditional classes. That's why it's also possible to use the object syntax inside the array syntax:

```vue-html
<div :class="[{ [activeClass]: isActive }, errorClass]">
```

### With Components {#with-components}

> This section assumes knowledge of [Components](/guide/essentials/component-basics). Feel free to skip it and come back later.

When you use the `class` attribute on a component with a single root element, those classes will be added to the component's root element and merged with any existing class already on it.

For example, if we have a component named `MyComponent` with the following template:

```vue-html

<p class="foo bar">Hi!</p>
```

Then add some classes when using it:

```vue-html

<MyComponent class="baz boo" />
```

The rendered HTML will be:

```vue-html
<p class="foo bar baz boo">Hi!</p>
```

The same is true for class bindings:

```vue-html
<MyComponent :class="{ active: isActive }" />
```

When `isActive` is truthy, the rendered HTML will be:

```vue-html
<p class="foo bar active">Hi!</p>
```

If your component has multiple root elements, you would need to define which element will receive this class. You can do this using the `$attrs` component property:

```vue-html

<p :class="$attrs.class">Hi!</p>
<span>This is a child component</span>
```

```vue-html
<MyComponent class="baz" />
```

Will render:

```html
<p class="baz">Hi!</p>
<span>This is a child component</span>
```

You can learn more about component attribute inheritance in [Fallthrough Attributes](/guide/components/attrs) section.

## Binding Inline Styles {#binding-inline-styles}

### Binding to Objects {#binding-to-objects-1}

`:style` supports binding to JavaScript object values - it corresponds to an [HTML element's `style` property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style):

```js
const activeColor = ref('red')
const fontSize = ref(30)
```

```js
data() {
  return {
    activeColor: 'red',
    fontSize: 30
  }
}
```

```vue-html
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }">
```

Although camelCase keys are recommended, `:style` also supports kebab-cased CSS property keys (corresponds to how they are used in actual CSS) - for example:

```vue-html
<div :style="{ 'font-size': fontSize + 'px' }">
```

It is often a good idea to bind to a style object directly so that the template is cleaner:

```js
const styleObject = reactive({
  color: 'red',
  fontSize: '30px'
})
```

```js
data() {
  return {
    styleObject: {
      color: 'red',
      fontSize: '13px'
    }
  }
}
```

```vue-html
<div :style="styleObject">
```

Again, object style binding is often used in conjunction with computed properties that return objects.

`:style` directives can also coexist with regular style attributes, just like `:class`.

Template:

```vue-html
<h1 style="color: red" :style="'font-size: 1em'">hello</h1>
```

It will render:

```vue-html
<h1 style="color: red; font-size: 1em;">hello</h1>
```

### Binding to Arrays {#binding-to-arrays-1}

We can bind `:style` to an array of multiple style objects. These objects will be merged and applied to the same element:

```vue-html
<div :style="[baseStyles, overridingStyles]">
```

### Auto-prefixing {#auto-prefixing}

When you use a CSS property that requires a [vendor prefix](https://developer.mozilla.org/en-US/docs/Glossary/Vendor_Prefix) in `:style`, Vue will automatically add the appropriate prefix. Vue does this by checking at runtime to see which style properties are supported in the current browser. If the browser doesn't support a particular property then various prefixed variants will be tested to try to find one that is supported.

### Multiple Values {#multiple-values}

You can provide an array of multiple (prefixed) values to a style property, for example:

```vue-html
<div :style="{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }">
```

This will only render the last value in the array which the browser supports. In this example, it will render `display: flex` for browsers that support the unprefixed version of flexbox.
