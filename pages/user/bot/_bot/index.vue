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
import { APIBot } from '~/api/types'

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotSlug extends Vue {
  bot: APIBot = {} as APIBot

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
