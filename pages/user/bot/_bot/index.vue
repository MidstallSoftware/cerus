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
import { BaseMessageInterface } from '~/api/message'

interface Command {
  id: number
  name: string
}

interface Bot {
  avatar: string
  discordId: string
  id: number
  name: string
  commands: Command[]
}

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotSlug extends Vue {
  bot: Bot = {} as Bot

  created() {
    this.$axios
      .$get(`/api/v1/bots?id=${this.$route.params.bot}`)
      .then((msg: BaseMessageInterface) => {
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
