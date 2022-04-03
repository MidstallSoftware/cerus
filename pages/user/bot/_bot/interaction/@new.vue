<template>
  <div>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
      <v-combobox
        v-model="typeName"
        :items="interactionTypes"
        placeholder="Interaction Event Type"
        required
      />
      <v-btn type="submit" :disabled="!valid" @click="submit">
        {{ $t('submit') }}
      </v-btn>
    </v-form>
  </div>
</template>
<i18n>
{
  "en": {
    "page-title": "New Interaction Hook",
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

    this.$axios.$get('/api/v1/instance/info').then((res) => {
      ;(this as PageUserBotInteractionNew).interactionTypes =
        res.data.constants.interactionTypes
    })
  },
})
export default class PageUserBotInteractionNew extends Vue {
  valid: boolean = false
  error?: Error | null = null
  typeName: string = ''
  interactionTypes: string[] = []

  submit(e: Event) {
    e.preventDefault()
    this.error = null

    if ((this.$refs.form as any).validate()) {
      this.$axios
        .post(
          `/api/v1/interactions?botId=${
            this.$route.params.bot
          }&type=${encodeURIComponent(this.typeName)}`
        )
        .then((res) => {
          this.$router.push(
            `/user/bot/${this.$route.params.bot}/interaction/${res.data.data.id}`
          )
        })
        .catch((e) => (this.error = e))
    }
  }
}
</script>
