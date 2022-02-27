<template>
  <v-card></v-card>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotSlug extends Vue {}
</script>
