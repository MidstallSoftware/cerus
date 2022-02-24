<template>
  <div></div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class PageIndex extends Vue {
  head() {
    return {
      title: 'Home',
      meta: [{ hid: 'og:title', name: 'og:title', content: 'Home - Cerus' }],
    }
  }
}
</script>
