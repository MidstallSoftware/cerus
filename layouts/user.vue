<template>
  <v-app dark>
    <v-app-bar app flat>
      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-if="isBotView"
      v-model="drawer"
      app
      permanent
      width="13vw"
    >
      <v-navigation-drawer
        v-model="drawer"
        absolute
        mini-variant
        mini-variant-width="2.7vw"
      >
        <bots-navigation />
      </v-navigation-drawer>
      <div class="pl-15">
        <h2 class="pl-16">{{ bot.name }}</h2>
        <v-list shaped>
          <v-list-item link>
            <a
              :href="'/user/bot/' + $route.params.bot"
              class="pl-4 text--primary text-decoration-none"
              link
            >
              <v-list-item-title>{{ $t('bot-info') }}</v-list-item-title>
            </a>
          </v-list-item>

          <v-subheader>{{ $t('commands') }}</v-subheader>
          <v-list-item v-if="bot.commands.length === 0" link>
            <a
              :href="'/user/bot/' + $route.params.bot + '/command/@new'"
              class="pl-4 text--primary text-decoration-none"
            >
              <v-list-item-title>{{ $t('new-command') }}</v-list-item-title>
            </a>
          </v-list-item>
          <v-list-item v-for="command in bot.commands" :key="command.id" link>
            <a
              :href="
                '/user/bot/' + $route.params.bot + '/command/' + command.id
              "
              class="pl-4 text--primary text-decoration-none"
            >
              <v-list-item-title v-text="command.name" />
            </a>
          </v-list-item>

          <v-subheader v-if="bot.premium">{{ $t('messages') }}</v-subheader>
          <v-list-item v-if="bot.messages.length === 0 && bot.premium" link>
            <a
              :href="'/user/bot' + $route.params.bot + '/message/@new'"
              class="pl-4 text--primary text-decoration-none"
            >
              <v-list-item-title>{{ $t('new-message') }}</v-list-item-title>
            </a>
          </v-list-item>
        </v-list>
      </div>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-else
      app
      permanent
      mini-variant
      mini-variant-width="2.7vw"
    >
      <bots-navigation />
    </v-navigation-drawer>

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
    "commands": "Commands",
    "messages": "Message Hooks",
    "bot-info": "Information",
    "new-bot": "Create a Bot",
    "new-command": "New Command",
    "new-message": "New Message Hook"
  }
}
</i18n>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIBot, APICommand } from '~/api/types'

@Component
export default class LayoutUser extends Vue {
  bot: APIBot = { commands: [], messages: [] } as APIBot
  drawer: any = true

  get command(): APICommand | undefined {
    if (!this.isCommandView) return undefined
    return this.bot.commands[parseInt(this.$route.params.cmd)]
  }

  get isBotView(): boolean {
    return (
      this.$route.fullPath.startsWith('/user/bot/') &&
      this.$route.fullPath !== '/user/bot/@new'
    )
  }

  get isCommandView(): boolean {
    return (
      typeof this.$route.params.cmd !== 'undefined' &&
      this.$route.fullPath.startsWith('/user/bot/') &&
      !this.$route.fullPath.includes('@new')
    )
  }

  get botIndex(): number | undefined {
    if (!this.isBotView) return undefined
    return parseInt(this.$route.params.bot)
  }

  get title(): string {
    const titleGen: Record<string, () => string> = {
      'user-bot-@new': () => this.$t('new-bot').toString(),
      'user-bot-bot-command-@new': () => this.$t('new-command').toString(),
      'user-bot-bot': () => this.$t('bot-info').toString(),
      'user-bot-bot-command-cmd': () => this.command.name,
    }

    for (const str of Object.keys(titleGen)) {
      const fn = titleGen[str]
      if (this.$route.name.split('___', 2)[0] === str) return fn()
    }
    return ''
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
