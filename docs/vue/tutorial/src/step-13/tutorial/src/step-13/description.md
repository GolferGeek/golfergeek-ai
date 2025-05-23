# Emits {#emits}

In addition to receiving props, a child component can also emit events to the parent:

```vue
<script setup>
// declare emitted events
const emit = defineEmits(['response'])

// emit with argument
emit('response', 'hello from child')
</script>
```

```js
export default {
  // declare emitted events
  emits: ['response'],
  setup(props, { emit }) {
    // emit with argument
    emit('response', 'hello from child')
  }
}
```

```js
export default {
  // declare emitted events
  emits: ['response'],
  created() {
    // emit with argument
    this.$emit('response', 'hello from child')
  }
}
```

The first argument to <span class="options-api">`this.$emit()`</span><span class="composition-api">`emit()`</span> is the event name. Any additional arguments are passed on to the event listener.

The parent can listen to child-emitted events using `v-on` - here the handler receives the extra argument from the child emit call and assigns it to local state:

```vue-html
<ChildComp @response="(msg) => childMsg = msg" />
```

```vue-html
<child-comp @response="(msg) => childMsg = msg"></child-comp>
```

Now try it yourself in the editor.
