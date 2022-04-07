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
          <v-btn color="red" @click="deleteThis">
            {{ $t('delete') }}
          </v-btn>
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
              <analytics :get-analytics="() => message.calls" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-dialog v-model="helpDialog">
          <template #activator="{ on, attrs }">
            <v-btn color="blue" icon v-bind="attrs" v-on="on">
              <fa :icon="['fas', 'question']" />
            </v-btn>
          </template>

          <v-card>
            <v-card-title class="text-h5 grey">
              {{ $t('help-title') }}
            </v-card-title>

            <v-card-text>
              {{ $t('help-p1') }}
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" text @click="helpDialog = false">
                {{ $t('close') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <client-only>
          <prism-editor
            ref="editor"
            v-model="message.code"
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
    "page-title": "{messageName} - {botName}",
    "title": "Info",
    "save": "Save",
    "saving": "Saving...",
    "delete": "Delete",
    "analytics": "Analytics",
    "close": "Close",
    "help-title": "Coding Message Hooks",
    "help-p1": "Cerus allows for running code when a message matches a regular expression. Cerus binds the message from Discord.JS into Lua via the \"message\" global variable. For more information, we suggest looking at the documentation for Discord.JS's Message class.",
    "download": "Export to Excel"
  }
}
</i18n>
<script lang="ts">
import _ from 'lodash'
import downloadFile from 'js-file-download'
/* eslint-disable @typescript-eslint/no-unused-vars */
import Prism, { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-lua'
import { PrismEditor } from 'vue-prism-editor'
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIBot, APIMessage } from '~/api/types'
import Analytics from '~/components/Analytics.vue'

@Component({
  head() {
    return {
      title: this.$t('page-title', {
        messageName: (this as PageUserBotMessageSlug).message.regex,
        botName: (this as PageUserBotMessageSlug).bot.name,
      }).toString(),
    }
  },
  components: {
    PrismEditor,
    Analytics,
  },
  middleware: 'auth',
  layout: 'user',
  mounted() {
    this.$axios
      .$get(`/api/v1/messages?id=${this.$route.params.msg}`)
      .then((msg: BaseMessageInterface) => {
        ;(this as PageUserBotMessageSlug).message = msg.data
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
        ;(this as PageUserBotMessageSlug).bot = msg.data
      })
      .catch((e) =>
        this.$nuxt.error({
          statusCode: 501,
          message: e.message,
        })
      )
  },
})
export default class PageUserBotMessageSlug extends Vue {
  message: APIMessage = { code: '', calls: [] } as unknown as APIMessage
  bot: APIBot = { premium: false } as APIBot
  saving: boolean = false
  error: Error = null
  helpDialog = false
  saveCode = _.throttle(() => {
    this.error = null
    this.saving = true
    this.$axios
      .$patch(`/api/v1/messages?id=${this.$route.params.msg}`, {
        code: (this.$refs.editor as any).codeData as string,
      })
      .then(() => (this.saving = false))
      .catch((e) => {
        this.error = e.response ? { message: e.response.data.detail } : e
        setTimeout(() => this.saveCode(), 30 * 60)
      })
  }, 20 * 60)

  downloadAnalytics() {
    this.error = null
    this.$axios
      .$get(`/api/v1/messages/export?id=${this.$route.params.msg}`, {
        responseType: 'blob',
      })
      .then((res) =>
        downloadFile(
          res,
          `cerus-${this.$route.params.bot}-${this.$route.params.msg}.xlsx`
        )
      )
      .catch(
        (e) =>
          (this.error = e.response ? { message: e.response.data.detail } : e)
      )
  }

  deleteThis() {
    this.error = null
    this.$axios
      .$delete(`/api/v1/messages?id=${this.$route.params.msg}`)
      .then(() => {
        this.$router.replace(`/user/bot/${this.$route.params.bot}`)
      })
      .catch(
        (e) =>
          (this.error = e.response ? { message: e.response.data.detail } : e)
      )
  }

  highlighter(code: string) {
    return highlight(code, languages.lua, 'lua')
  }
}
</script>
