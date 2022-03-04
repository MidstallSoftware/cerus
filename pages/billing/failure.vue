<template>
  <v-row justify="center" align="start">
    <v-col cols="12" md="10" lg="8" xl="8">
      <v-card>
        <v-card-text>{{ $t('message') }}</v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<i18n>
{
  "en": {
    "message": "Billing failed, we're unsure what happened."
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  head: {
    title: 'Billing Failed',
    meta: [
      { hid: 'og:title', name: 'og:title', content: 'Billing Failed - Cerus' },
    ],
  },
})
export default class PageBillingFailure extends Vue {}
</script>
