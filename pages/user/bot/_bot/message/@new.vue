<template>
  <div>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
      <v-text-field v-model="name" placeholder="Message RegEx" required />
      <v-btn type="submit" :disabled="!valid" @click="submit">
        {{ $t('submit') }}
      </v-btn>
    </v-form>
  </div>
</template>
<i18n>
{
  "en": {
    "page-title": "New Message Hook",
    "submit": "Submit"
  }
}
</i18n>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
  head() {
    return {
      title: this.$t('page-title').toString(),
    }
  },
  middleware: 'auth',
  layout: 'user',
  mounted() {
    this.$axios.$get(`/api/v1/bots?id=${this.$route.params.bot}`).catch((e) =>
      this.$nuxt.error({
        statusCode: 501,
        message: e.message,
      })
    )
  },
})
export default class PageUserBotMessageNew extends Vue {
  valid: boolean = false
  error?: Error | null = null
  name: string = ''

  submit(e: Event) {
    e.preventDefault()
    this.error = null

    if ((this.$refs.form as any).validate()) {
      this.$axios
        .post(
          `/api/v1/messages?botId=${
            this.$route.params.bot
          }&regex=${encodeURIComponent(this.name)}`
        )
        .then((res) => {
          this.$router.push(
            `/user/bot/${this.$route.params.bot}/message/${res.data.data.id}`
          )
        })
        .catch(
          (e) =>
            (this.error = e.response ? { message: e.response.data.detail } : e)
        )
    }
  }
}
</script>
