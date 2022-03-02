<template>
  <v-app dark>
    <v-app-bar app clipped-right flat height="72">
      <v-responsive class="pl-16">
        <v-app-bar-title>{{
          isBotView ? this.bot.name : 'AAA'
        }}</v-app-bar-title>
      </v-responsive>
    </v-app-bar>

    <v-navigation-drawer
      v-if="isBotView"
      v-model="drawer"
      app
      clipped
      width="300"
    >
      <BotsNavigation v-model="drawer" />

      <v-sheet color="grey lighten-5" height="128" width="100%" />

      <v-list class="pl-14" shaped>
        <v-subheader>{{ $t('commands') }}</v-subheader>
        <v-list-item v-for="command in bot.commands" :key="command.id" link>
          <v-list-item-title v-text="command.name" />
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <bots-navigation v-else v-model="drawer" />

    <v-main>
      <v-container fluid>
        <Nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>
<i18n>
{
  "en": {
    "commands": "Commands"
  }
}
</i18n>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
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

@Component
export default class LayoutUser extends Vue {
  bot: Bot = { commands: [] } as Bot
  drawer: any = true

  get isBotView(): boolean {
    return (
      this.$route.fullPath.startsWith('/user/bot/') &&
      this.$route.fullPath !== '/user/bot/@new'
    )
  }

  get botIndex(): number | undefined {
    if (!this.isBotView) return undefined
    return parseInt(this.$route.params.bot)
  }

  created() {
    if (this.isBotView) {
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
}
</script>
<style lang="scss">
.bot-active {
  box-shadow: 10px;
}
</style>
