<template>
  <v-app dark>
    <v-navigation-drawer v-if="isBotView" app permanent width="300">
      <BotsNavigation />
    </v-navigation-drawer>
    <BotsNavigation v-else permament />

    <v-main>
      <Nuxt />
    </v-main>
  </v-app>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LayoutUser extends Vue {
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
}
</script>
<style lang="scss">
.bot-active {
  box-shadow: 10px;
}
</style>
