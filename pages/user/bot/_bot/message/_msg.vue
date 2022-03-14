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
    "title": "Info",
    "save": "Save",
    "saving": "Saving...",
    "delete": "Delete"
  }
}
</i18n>
<script lang="ts">
import _ from 'lodash'
import Prism from 'prismjs'
import 'prismjs/components/prism-lua'
import { PrismEditor } from 'vue-prism-editor'
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIMessage } from '~/api/types'

@Component({
  components: {
    PrismEditor,
  },
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotCommandSlug extends Vue {
  message: APIMessage = { code: '' } as unknown as APIMessage
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

  deleteThis() {
    this.error = null
    this.$axios
      .$delete(`/api/v1/messages?id=${this.$route.params.msg}`)
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

  created() {
    this.$axios
      .$get(`/api/v1/messages?id=${this.$route.params.msg}`)
      .then((msg: BaseMessageInterface) => {
        this.message = msg.data
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