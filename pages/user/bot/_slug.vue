<template>
  <div>
    <v-toolbar dense>
      <v-toolbar-title>{{ $t('title') }}</v-toolbar-title>
    </v-toolbar>
  </div>
</template>
<i18n>
{
  "en": {
    "title": "Info"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotSlug extends Vue {}
</script>
