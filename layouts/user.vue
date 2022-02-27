<template>
  <v-app dark>
    <v-navigation-drawer app permanent width="15%">
      <v-row class="fill-height" no-gutters>
        <v-navigation-drawer mini-variant mini-variant-width="56" permanent>
          <v-list-item class="px-2" href="/user/bot/@new">
            <v-list-item-avatar>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <a href="/user/bot/@new" class="text--primary mx-4">
                    <v-btn rounded v-bind="attrs" v-on="on">
                      <fa :icon="['fas', 'plus']" />
                    </v-btn>
                  </a>
                </template>
                <span>{{ $t('new-bot') }}</span>
              </v-tooltip>
            </v-list-item-avatar>
          </v-list-item>

          <v-divider />

          <v-list dense nav>
            <v-list-item
              v-for="(bot, index) in bots"
              :key="index"
              :href="'/user/bot/' + bot.id.toString()"
              active-class="bot-active"
            >
              <v-list-item-action>
                <a :href="'/user/bot/' + bot.id.toString()">
                  <v-avatar size="42">
                    <v-img
                      :src="
                        'https://cdn.discordapp.com/avatars/' +
                        bot.discordId +
                        '/' +
                        bot.avatar +
                        '.png'
                      "
                      :alt="bot.name"
                    />
                  </v-avatar>
                </a>
              </v-list-item-action>

              <v-list-item-content>
                <v-list-item-title>{{ bot.name }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
      </v-row>
    </v-navigation-drawer>

    <v-main>
      <Nuxt />
    </v-main>
  </v-app>
</template>
<i18n>
{
  "en": {
    "new-bot": "Create a Bot"
  }
}
</i18n>
<style lang="scss">
.bot-active {
  box-shadow: 10px;
}
</style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

interface Bot {
  avatar: string
  discordId: string
  id: number
  name: string
}

@Component
export default class LayoutUser extends Vue {
  bots: Bot[] = []

  get isBotView(): boolean {
    return (
      this.$route.fullPath.startsWith('/user/bot/') &&
      this.$route.fullPath !== '/user/bot/@new'
    )
  }

  get botIndex(): number | undefined {
    if (!this.isBotView) return undefined
    return parseInt(this.$route.params.slug)
  }

  created() {
    if (!process.client) return

    this.$axios
      .get('/api/v1/bots/list')
      .then((res) => (this.bots = res.data.data.list))
  }
}
</script>
