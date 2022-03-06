<template>
  <div>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ $t('title') }}</v-card-title>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
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
    "title": "Info",
    "save": "Save",
    "saving": "Saving..."
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
import { APICommand } from '~/api/types'

@Component({
  components: {
    PrismEditor,
  },
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotCommandSlug extends Vue {
  command: APICommand = { code: '' } as APICommand
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

  highlighter(code: string) {
    return Prism.highlight(code, Prism.languages.lua, 'lua')
  }

  created() {
    this.$axios
      .$get(`/api/v1/commands?id=${this.$route.params.cmd}`)
      .then((msg: BaseMessageInterface) => {
        this.command = msg.data
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
