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
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="bot.token"
                  class="d-inline-block"
                  type="password"
                  :label="$t('token')"
                />
                <v-btn @click="updateToken">
                  {{ $t('update-token') }}
                </v-btn>
              </v-col>
            </v-row>
            <p>
              <fa :icon="['fas', bot.premium ? 'check' : 'xmark']" />
              {{ $t('premium') }}
            </p>
            <p>
              <fa :icon="['fas', bot.running ? 'check' : 'xmark']" />
              {{ $t('running') }}
            </p>
            <p>{{ $t('created', { value: bot.created }) }}</p>
            <v-btn :disabled="startingStopping" @click="startStop">{{
              $t(bot.running ? 'stop' : 'start')
            }}</v-btn>
            <v-btn color="red" @click="deleteThis">
              {{ $t('delete') }}
            </v-btn>
            <v-btn color="blue" @click="inviteBot">
              {{ $t('invite-bot') }}
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
    <div v-else>
      <v-row>
        <v-col cols="12">
          <v-card class="mx-auto">
            <v-card-title>{{ $t('premium-management') }}</v-card-title>
            <v-card-text>
              <v-btn @click="cancelPremium">
                {{ $t('premium-cancel') }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-col cols="12">
            <v-card class="mx-auto">
              <v-card-title>{{ $t('analytics') }}</v-card-title>
              <v-card-text>
                <v-btn @click="downloadAnalytics">
                  {{ $t('download') }}
                </v-btn>
                <analytics :get-analytics="() => botCalls" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-col>
      </v-row>
    </div>
    <v-snackbar v-model="snackbar" top>
      {{ snackbarMessage }}
      <template #action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
          {{ $t('close') }}
        </v-btn>
      </template>
    </v-snackbar>
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
    "invite-bot": "Invite",
    "analytics": "Analytics",
    "download": "Export to Excel",
    "snackbar-message-start": "The bot has been started",
    "snackbar-message-stop": "The bot has been shutdown",
    "close": "Close",
    "token": "Token",
    "update-token": "Update",
    "premium-management": "Premium",
    "premium-cancel": "Cancel",
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
import downloadFile from 'js-file-download'
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIBot, APIInteractionCall } from '~/api/types'
import Analytics from '~/components/Analytics.vue'

@Component({
  head() {
    return {
      title: (this as PageUserBotSlug).bot.name,
    }
  },
  components: {
    Analytics,
  },
  middleware: 'auth',
  layout: 'user',
  mounted() {
    this.$axios
      .$get(`/api/v1/bots?id=${this.$route.params.bot}`)
      .then((msg: BaseMessageInterface) => {
        msg.data.created = new Date((msg.data as APIBot).created)
        ;(this as PageUserBotSlug).bot = msg.data
      })
      .catch((e) =>
        this.$nuxt.error({
          statusCode: 501,
          message: e.message,
        })
      )
  },
})
export default class PageUserBotSlug extends Vue {
  bot: APIBot = { premium: false } as APIBot
  validSettings: boolean = false
  premiumValid: boolean = false
  error: Error = null
  startingStopping: boolean = false
  snackbar: boolean = false
  snackbarMessage: string = ''

  get botCalls() {
    if (!this.bot.premium) return []
    return [
      ...(this.bot.messages || []).map((m) => m.calls).flat(),
      ...(this.bot.commands || [])
        .map((c) => c.calls as APIInteractionCall[])
        .flat(),
    ]
  }

  downloadAnalytics() {
    this.error = null
    this.$axios
      .$get(`/api/v1/bots?id=${this.$route.params.bot}`, {
        responseType: 'blob',
      })
      .then((res) => downloadFile(res, `cerus-${this.$route.params.bot}.xlsx`))
      .catch(
        (e) =>
          (this.error = e.response ? { message: e.response.data.detail } : e)
      )
  }

  inviteBot() {
    window.open(
      `https://discord.com/api/oauth2/authorize?client_id=${this.bot.discordId}&permissions=0&scope=bot%20applications.commands`,
      '_blank'
    )
  }

  updateToken() {
    this.error = null
    this.$axios
      .$patch(`/api/v1/bots?id=${this.$route.params.bot}`, {
        token: this.bot.token,
      })
      .then((msg: BaseMessageInterface) => {
        msg.data.created = new Date(msg.data.created)
        this.bot = msg.data
      })
      .catch(
        (e) =>
          (this.error = e.response ? { message: e.response.data.detail } : e)
      )
  }

  startStop() {
    if (!this.startingStopping) {
      this.error = null
      this.startingStopping = true
      this.$axios
        .$patch(`/api/v1/bots?id=${this.$route.params.bot}`, {
          running: !this.bot.running,
        })
        .then((msg: BaseMessageInterface) => {
          msg.data.created = new Date(msg.data.created)
          this.bot = msg.data
          this.snackbar = true
          this.snackbarMessage = this.$t(
            `snackbar-message-${this.bot.running ? 'start' : 'stop'}`
          ).toString()
        })
        .finally(() => (this.startingStopping = false))
        .catch(
          (e) =>
            (this.error = e.response ? { message: e.response.data.detail } : e)
        )
    }
  }

  deleteThis() {
    this.error = null
    this.$axios
      .$delete(`/api/v1/bots?id=${this.$route.params.bot}`)
      .then(() => {
        this.$router.push(`/user/`)
      })
      .catch(
        (e) =>
          (this.error = e.response ? { message: e.response.data.detail } : e)
      )
  }

  cancelPremium() {
    this.error = null
    this.$axios
      .post('/api/v1/billing/cancel', {
        id: parseInt(this.$route.params.bot),
        type: 'bot',
      })
      .then(() => this.$axios.$get(`/api/v1/bots?id=${this.$route.params.bot}`))
      .then((msg: BaseMessageInterface) => {
        msg.data.created = new Date(msg.data.created)
        this.bot = msg.data
      })
      .catch(
        (e) =>
          (this.error = e.response ? { message: e.response.data.detail } : e)
      )
  }

  premiumSubmit(e: Event) {
    e.preventDefault()
    if ((this.$refs.premiumSignup as any).validate()) {
      this.error = null
      this.$axios
        .post(`/api/v1/billing/checkout`, {
          id: parseInt(this.$route.params.bot),
          type: 'bot',
          lookup_key: 'cerus_prem_bot',
          url: window.location.href,
        })
        .then((res) => {
          window.location.assign(res.data.data.url)
        })
        .catch(
          (e) =>
            (this.error = e.response ? { message: e.response.data.detail } : e)
        )
    }
  }
}
</script>
