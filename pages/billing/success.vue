<template>
  <v-row justify="center" align="start">
    <v-col cols="12" md="10" lg="8" xl="8">
      <v-card>
        <v-card-title>{{ $t('title') }}</v-card-title>
        <v-form ref="form">
          <v-alert v-if="error != null" type="error">{{
            error.message
          }}</v-alert>
          <v-btn type="submit" @click="submit">
            {{ $t('submit') }}
          </v-btn>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>
<i18n>
{
  "en": {
    "title": "Checkout"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  head: {
    title: 'Billing Checkout',
    meta: [
      {
        hid: 'og:title',
        name: 'og:title',
        content: 'Billing Checkout - Cerus',
      },
    ],
  },
  mounted() {
    if (typeof this.$route.query.id === 'undefined') {
      this.$nuxt.error({
        statusCode: 404,
        message: 'No session was specified',
      })
    }
    if (typeof this.$route.query.url === 'undefined') {
      this.$nuxt.error({
        statusCode: 404,
        message: 'No URL was specified',
      })
    }
  },
})
export default class PageBillingSuccess extends Vue {
  error: Error = null

  submit(e: Event) {
    e.preventDefault()
    if ((this.$refs.form as any).validate()) {
      this.$axios
        .post(`/api/v1/billing/portal`, {
          id: this.$route.query.id,
          url: this.$route.query.url,
        })
        .then((res) => {
          this.$router.push(res.data.data.url)
        })
        .catch((e) => (this.error = e))
    }
  }
}
</script>
