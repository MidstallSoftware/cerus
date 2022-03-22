<template>
  <div>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
      <v-text-field v-model="name" placeholder="Command Name" required />
      <v-btn type="submit" :disabled="!valid" @click="submit">
        {{ $t('submit') }}
      </v-btn>
    </v-form>
  </div>
</template>
<i18n>
{
  "en": {
    "submit": "Submit",
    "page-title": "New Command"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

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
export default class PageUserBotCommandNew extends Vue {
  valid: boolean = false
  error?: Error | null = null
  name: string = ''

  submit(e: Event) {
    e.preventDefault()
    this.error = null

    if ((this.$refs.form as any).validate()) {
      this.$axios
        .post(
          `/api/v1/commands?botId=${
            this.$route.params.bot
          }&name=${encodeURIComponent(this.name)}`
        )
        .then((res) => {
          window.location.assign(
            `/user/bot/${this.$route.params.bot}/command/${res.data.data.id}`
          )
        })
        .catch((e) => (this.error = e))
    }
  }
}
</script>
