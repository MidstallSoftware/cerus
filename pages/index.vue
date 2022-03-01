<template>
  <div></div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  head: {
    title: 'Home',
    meta: [{ hid: 'og:title', name: 'og:title', content: 'Home - Cerus' }],
  },
})
export default class PageIndex extends Vue {}
</script>
