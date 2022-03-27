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
  message: APIMessage = { code: '' } as unknown as APIMessage
  bot: APIBot = { premium: false } as APIBot
  saving: boolean = false
  error: Error = null
  saveCode = _.throttle(() => {
    this.error = null
    this.saving = true
    this.$axios
      .$patch(`/api/v1/messages?id=${this.$route.params.msg}`, {
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
      .$get(`/api/v1/messages/export?id=${this.$route.params.msg}`, {
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
      .$delete(`/api/v1/messages?id=${this.$route.params.msg}`)
      .then(() => {
        this.$router.replace(`/user/bot/${this.$route.params.bot}`)
      })
      .catch((e) => {
        this.error = e
      })
  }

  highlighter(code: string) {
    return highlight(code, languages.lua, 'lua')
  }
}
</script>
