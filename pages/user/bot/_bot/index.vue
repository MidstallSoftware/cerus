<template>
  <div>
    <v-row v-if="error != null">
      <v-col cols="12">
        <v-alert type="error">{{ error.message }}</v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card id="basic">
          <v-card-title>{{ $t('info') }}</v-card-title>
          <v-card-text>
            <p>
              <fa :icon="['fas', bot.premium ? 'check' : 'xmark']" />
              {{ $t('premium') }}
            </p>
            <p>
              <fa :icon="['fas', bot.running ? 'check' : 'xmark']" />
              {{ $t('running') }}
            </p>
            <p>{{ $t('created', { value: bot.created }) }}</p>
            <v-btn @click="startStop">{{
              $t(bot.running ? 'stop' : 'start')
            }}</v-btn>
            <v-btn color="red" @click="deleteThis">
              {{ $t('delete') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="!bot.premium">
      <v-col cols="12">
        <v-card id="premium">
          <v-card-title>{{ $t('premium-signup') }}</v-card-title>
          <v-card-text>
            <p>{{ $t('premium-signup-text') }}</p>
            <h2>{{ $t('premium-features-heading') }}</h2>
            <ul>
              <li v-for="i in 2" :key="i">{{ $t(`premium-feature${i}`) }}</li>
            </ul>

            <v-form ref="premiumSignup">
              <v-btn type="submit" @click="premiumSubmit">
                {{ $t('premium-signup-btn') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<i18n>
{
  "en": {
    "info": "Information",
    "premium": "Premium",
    "created": "Created: {value}",
    "running": "Running",
    "start": "Start",
    "stop": "Stop",
    "delete": "Delete",
    "premium-signup": "Sign up for Premium",
    "premium-signup-text": "Making your bot a premium bot gives you access to the best features we can provide.",
    "premium-features-heading": "Features",
    "premium-feature1": "Analytics",
    "premium-feature2": "Message Hooks",
    "premium-signup-btn": "Sign up now"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIBot } from '~/api/types'

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotSlug extends Vue {
  bot: APIBot = { premium: false } as APIBot
  validSettings: boolean = false
  premiumValid: boolean = false
  error: Error = null

  startStop() {
    this.error = null
    this.$axios
      .$patch(`/api/v1/bots?id=${this.$route.params.bot}`, {
        running: !this.bot.running,
      })
      .then((msg: BaseMessageInterface) => {
        msg.data.created = new Date(msg.data.created)
        this.bot = msg.data
      })
      .catch((e) => (this.error = e))
  }

  deleteThis() {
    this.error = null
    this.$axios
      .$delete(`/api/v1/bots?id=${this.$route.params.bot}`)
      .then(() => {
        window.location.assign(`/user/`)
      })
      .catch((e) => {
        this.error = e
      })
  }

  premiumSubmit(e: Event) {
    e.preventDefault()
    if ((this.$refs.premiumSignup as any).validate()) {
      this.error = null
      this.$axios
        .post(`/api/v1/billing/checkout`, {
          id: parseInt(this.$route.params.bot),
          type: 'bot',
          lookup_key: 'prem_bot',
          url: window.location.href,
        })
        .then((res) => {
          window.location.assign(res.data.data.url)
        })
        .catch((e) => (this.error = e))
    }
  }

  created() {
    this.$axios
      .$get(`/api/v1/bots?id=${this.$route.params.bot}`)
      .then((msg: BaseMessageInterface) => {
        msg.data.created = new Date(msg.data.created)
        this.bot = msg.data
      })
      .catch((e) =>
        this.$nuxt.error({
          statusCode: 501,
          message: e.message,
        })
      )
  }
}
</script>
