<template>
  <v-app dark>
    <v-app-bar app flat>
      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>

    <client-only>
      <v-navigation-drawer v-if="isBotView" app permanent width="13vw">
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
            <v-list-item v-for="command in bot.commands" :key="command.id" link>
              <a
                :href="
                  '/user/bot/' + $route.params.bot + '/command/' + command.id
                "
                class="pl-4 text--primary text-decoration-none"
              >
                <v-list-item-title>
                  <p>
                    <span class="blue-grey--text darken-2--text">/</span>
                    {{ command.name }}
                  </p>
                </v-list-item-title>
              </a>
            </v-list-item>
            <v-list-item link>
              <a
                :href="'/user/bot/' + $route.params.bot + '/command/@new'"
                class="pl-4 text--primary text-decoration-none"
              >
                <v-list-item-title
                  ><i>{{ $t('new-command') }}</i></v-list-item-title
                >
              </a>
            </v-list-item>

            <div v-if="bot.premium">
              <v-subheader>{{ $t('messages') }}</v-subheader>
              <v-list-item
                v-for="message in bot.messages"
                :key="message.id"
                link
              >
                <a
                  :href="
                    '/user/bot/' + $route.params.bot + '/message/' + message.id
                  "
                  class="pl-4 text--primary text-decoration-none"
                >
                  <v-list-item-title v-text="message.regex" />
                </a>
              </v-list-item>
              <v-list-item link>
                <a
                  :href="'/user/bot/' + $route.params.bot + '/message/@new'"
                  class="pl-4 text--primary text-decoration-none"
                >
                  <v-list-item-title
                    ><i>{{ $t('new-message') }}</i></v-list-item-title
                  >
                </a>
              </v-list-item>
            </div>
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
    </client-only>

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
import BotsNavigation from '~/components/BotsNavigation.vue'

@Component({
  components: {
    BotsNavigation,
  },
  mounted() {
    if ((this as LayoutUser).isBotView || (this as LayoutUser).isCommandView) {
      this.$axios
        .$get(`/api/v1/bots?id=${this.$route.params.bot}`)
        .then((msg: BaseMessageInterface) => {
          ;(this as LayoutUser).bot = msg.data
        })
        .catch((e) =>
          this.$nuxt.error({
            statusCode: 501,
            message: e.message,
          })
        )
    }
  },
})
export default class LayoutUser extends Vue {
  bot: APIBot = { commands: [], messages: [] } as APIBot

  get command(): APICommand | undefined {
    if (!this.isCommandView) return undefined
    return this.bot.commands.find(
      ({ id }) => id === parseInt(this.$route.params.cmd.toString())
    )
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
    return parseInt(this.$route.params.bot.toString())
  }

  get title(): string {
    const titleGen: Record<string, () => string> = {
      'user-bot-@new': () => this.$t('new-bot').toString(),
      'user-bot-bot-command-@new': () => this.$t('new-command').toString(),
      'user-bot-bot': () => this.$t('bot-info').toString(),
      'user-bot-bot-command-cmd': () => {
        const cmd = this.bot.commands.find(
          ({ id }) => id === parseInt(this.$route.params.cmd.toString())
        )
        return typeof cmd === 'object' ? '/' + cmd.name : ''
      },
      'user-bot-bot-message-@new': () => this.$t('new-message').toString(),
      'user-bot-bot-message-msg': () => {
        const msg = this.bot.messages.find(
          ({ id }) => id === parseInt(this.$route.params.msg.toString())
        )
        return typeof msg === 'object' ? msg.regex : ''
      },
    }

    for (const str of Object.keys(titleGen)) {
      const fn = titleGen[str]
      if (this.$route.name.split('___', 2)[0] === str) return fn()
    }
    return ''
  }
}
</script>
<style lang="scss">
.bot-active {
  box-shadow: 10px;
}
</style>
