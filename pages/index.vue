<template>
  <div></div>
</template>
<i18n>
{
  "en": {
    "page-title": "Home"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  head() {
    return {
      title: this.$t('page-title').toString(),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$t('full-title', {
            page: this.$t('page-title'),
          }).toString(),
        },
      ],
    }
  },
})
export default class PageIndex extends Vue {}
</script>
