<template>
  <div>
    <v-list-item class="px-2" href="/user/bot/@new">
      <v-list-item-avatar>
        <v-tooltip right>
          <template #activator="{ on, attrs }">
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
          <v-tooltip right>
            <template #activator="{ on, attrs }">
              <a
                :href="'/user/bot/' + bot.id.toString()"
                v-bind="attrs"
                v-on="on"
              >
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
            </template>
            <span>{{ bot.name }}</span>
          </v-tooltip>
        </v-list-item-action>

        <v-list-item-content>
          <v-list-item-title>{{ bot.name }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>
<i18n>
{
  "en": {
    "new-bot": "Create a Bot"
  }
}
</i18n>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { APIBot } from '~/api/types'

@Component
export default class BotsNavigation extends Vue {
  bots: APIBot[] = []

  created() {
    this.$axios
      .get('/api/v1/bots/list')
      .then((res) => (this.bots = res.data.data.list))
  }
}
</script>
