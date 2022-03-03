<template>
  <div></div>
</template>
<i18n>
{
  "en": {
    "title": "Info"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '../../../../../api/message'
import { APIBot, APICommand } from '~/api/types'

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotCommandSlug extends Vue {
  bot: APIBot = {} as APIBot
  command: APICommand = {} as APICommand

  created() {
    this.$axios
      .$get(`/api/v1/bots?id=${this.$route.params.bot}`)
      .then((msg: BaseMessageInterface) => {
        this.bot = msg.data
        this.command = this.bot.commands.find(
          (cmd) => cmd.id === parseInt(this.$route.params.cmd)
        )
        if (this.command === null || this.command === undefined) {
          this.$nuxt.error({
            statusCode: 404,
            message: 'Page not found',
          })
        }
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
