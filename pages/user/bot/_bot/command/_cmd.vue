<template>
  <div>
    <v-row v-if="error != null">
      <v-col cols="12">
        <v-alert type="error">{{ error.message }}</v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ $t('title') }}</v-card-title>
          <v-card-text>
            <p v-if="!command.premium">{{ $t('calls', command.calls) }}</p>
            <v-btn color="red" @click="deleteThis">
              {{ $t('delete') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <div v-if="command.premium">
      <v-row>
        <v-col cols="12">
          <v-card class="mx-auto">
            <v-card-title>{{ $t('analytics') }}</v-card-title>
            <v-card-text>
              <v-btn @click="downloadAnalytics">
                {{ $t('download') }}
              </v-btn>
              <analytics :get-analytics="() => command.calls" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
    </div>
    <div v-else>
      <v-row>
        <v-col cols="12">
          <v-card id="premium">
            <v-card-title>{{ $t('premium-signup') }}</v-card-title>
            <v-card-text>
              <p>{{ $t('premium-signup-text') }}</p>
              <h2>{{ $t('premium-features-heading') }}</h2>
              <ul>
                <li v-for="i in 3" :key="i">{{ $t(`premium-feature${i}`) }}</li>
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
    <v-row>
      <v-col cols="12">
        <client-only>
          <prism-editor
            ref="editor"
            v-model="command.code"
            :highlight="highlighter"
            line-numbers
            @keydown="saveCode"
          />
        </client-only>
      </v-col>
    </v-row>
  </div>
</template>
<i18n>
{
  "en": {
    "page-title": "/{commandName} - {botName}",
    "title": "Info",
    "save": "Save",
    "saving": "Saving...",
    "delete": "Delete",
    "analytics": "Analytics",
    "download": "Export to Excel",
    "calls": "# of interactions... this month: {thisMonth}, this year: {thisYear}, in forever: {lifetime}",
    "premium-management": "Premium",
    "premium-cancel": "Cancel",
    "premium-signup": "Sign up for Premium",
    "premium-signup-text": "Gives the command access to caching and storing data",
    "premium-features-heading": "Features",
    "premium-feature1": "Caching",
    "premium-feature2": "Database",
    "premium-feature3": "Analytics",
    "premium-signup-btn": "Sign up now"
  }
}
</i18n>
<script lang="ts">
import downloadFile from 'js-file-download'
import _ from 'lodash'
import Prism from 'prismjs'
import 'prismjs/components/prism-lua'
import { PrismEditor } from 'vue-prism-editor'
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIBot, APICommand, APIInteractionCall } from '~/api/types'

@Component({
  head() {
    return {
      title: this.$t('page-title', {
        commandName: (this as PageUserBotCommandSlug).command.name,
        botName: (this as PageUserBotCommandSlug).bot.name,
      }).toString(),
    }
  },
  components: {
    PrismEditor,
  },
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotCommandSlug extends Vue {
  command: APICommand = { code: '', calls: [] } as APICommand
  bot: APIBot = { premium: false } as APIBot
  saving: boolean = false
  error: Error = null
  saveCode = _.throttle(() => {
    this.error = null
    this.saving = true
    this.$axios
      .$patch(`/api/v1/commands?id=${this.$route.params.cmd}`, {
        code: (this.$refs.editor as any).codeData as string,
      })
      .then(() => (this.saving = false))
      .catch((e) => {
        this.error = e
        setTimeout(() => this.saveCode(), 30 * 60)
      })
  }, 20 * 60)

  downloadAnalytics() {
    this.error = null
    this.$axios
      .$get(`/api/v1/commands/export?id=${this.$route.params.cmd}`, {
        responseType: 'blob',
      })
      .then((res) =>
        downloadFile(
          res,
          `cerus-${this.$route.params.bot}-${this.$route.params.cmd}.xlsx`
        )
      )
      .catch((e) => (this.error = e))
  }

  deleteThis() {
    this.error = null
    this.$axios
      .$delete(`/api/v1/commands?id=${this.$route.params.cmd}`)
      .then(() => {
        window.location.assign(`/user/bot/${this.$route.params.bot}`)
      })
      .catch((e) => {
        this.error = e
      })
  }

  highlighter(code: string) {
    return Prism.highlight(code, Prism.languages.lua, 'lua')
  }

  cancelPremium() {
    this.error = null
    this.$axios
      .post('/api/v1/billing/cancel', {
        id: parseInt(this.$route.params.cmd),
        type: 'command',
      })
      .then(() =>
        this.$axios.$get(`/api/v1/commands?id=${this.$route.params.cmd}`)
      )
      .then((msg: BaseMessageInterface) => {
        if (msg.data.premium)
          msg.data.calls = msg.data.calls.map((call: APIInteractionCall) => {
            call.timestamp = new Date(call.timestamp)
            return call
          })
        this.command = msg.data
      })
      .catch((e) => (this.error = e))
  }

  premiumSubmit(e: Event) {
    e.preventDefault()
    if ((this.$refs.premiumSignup as any).validate()) {
      this.error = null
      this.$axios
        .post(`/api/v1/billing/checkout`, {
          id: parseInt(this.$route.params.cmd),
          type: 'command',
          lookup_key: 'cerus_prem_command',
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
      .$get(`/api/v1/commands?id=${this.$route.params.cmd}`)
      .then((msg: BaseMessageInterface) => {
        if (msg.data.premium)
          msg.data.calls = msg.data.calls.map((call: APIInteractionCall) => {
            call.timestamp = new Date(call.timestamp)
            return call
          })
        this.command = msg.data
        this.$forceUpdate()
      })
      .catch((e) =>
        this.$nuxt.error({
          statusCode: 501,
          message: e.message,
        })
      )

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
