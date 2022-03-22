<template>
  <div>
    <v-row justify="center">
      <v-col cols="12" md="6" lg="7" xl="7">
        <v-card>
          <v-card-title>{{ $t('intro') }}</v-card-title>
          <v-card-text>
            <p>{{ $t('intro-p1') }}</p>
            <p>
              {{ $t('contact') }}
              <a href="mailto:inquiry@midstall.com" class="text--primary"
                >inquiry@midstall.com</a
              >
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" lg="3" xl="3">
        <v-card>
          <v-card-title>{{ $t('features') }}</v-card-title>
          <v-card-text>
            <ul>
              <li v-for="i in 6" :key="i">{{ $t(`feat-${i}`) }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="6" lg="7" xl="7">
        <v-card>
          <v-card-title>{{ $t('oss') }}</v-card-title>
          <v-card-text>
            <p>{{ $t('oss-p1') }}</p>
            <h2>{{ $t('deps') }}</h2>
            <ul>
              <li v-for="i in 4" :key="i">{{ $t(`dep-${i}`) }}</li>
            </ul>
            <p>
              <i>{{ $t('deps-more') }}</i>
              <a
                href="https://github.com/MidstallSoftware/cerus/blob/master/package.json"
                class="text--primary"
                >@MidstallSoftware/cerus/package.json</a
              >
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" lg="3" xl="3">
        <v-card>
          <v-card-title>{{ $t('planned') }}</v-card-title>
          <v-card-text>
            <p>{{ $t('planned-p1') }}</p>
            <ul>
              <li v-for="i in 3" :key="i">{{ $t(`planned-${i}`) }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="10" xl="10">
        <v-card>
          <v-card-title>{{ $t('stats') }}</v-card-title>
          <v-card-text>
            <v-alert v-if="statsError !== null" type="error">{{
              statsError.message
            }}</v-alert>
            <v-btn @click="loadStats">{{ $t('stats-refresh') }}</v-btn>
            <ul>
              <li>{{ $t('stats-bots', stats.bots) }}</li>
              <li>{{ $t('stats-users', stats.users) }}</li>
              <li>
                {{ $t('stats-uptime', formatUptime(stats.uptime)) }}
              </li>
              <li>
                {{ $t('stats-mem', formatMemory(stats.memory)) }}
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<i18n>
{
  "en": {
    "page-title": "Home",
    "intro": "Introducing Cerus",
    "intro-p1": "Cerus is a Discord bot hosting service provided by Midstall Software. It aims to provide an easy solution to hosting bots while remaining cheap. Unlike just running a VPS, Virtual Private Server, you are given access to bot metrics such as the number of times a bot runs and the errors given. However, this service is in its early stages so things may not be working correctly.",
    "contact": "Notice any issues or bugs? Feel free to contact us at:",
    "features": "Features",
    "feat-1": "Slash Commands",
    "feat-2": "Filtered Message Hooks",
    "feat-3": "Detailed Analytics",
    "feat-4": "Caching",
    "feat-5": "Data storage",
    "feat-6": "Programmable with Lua",
    "oss": "Powered by Open Source Software",
    "oss-p1": "Cerus is powered by open source software and it in fact open source itself",
    "deps": "Notable Dependencies",
    "dep-1": "NuxtJS",
    "dep-2": "Objection.JS",
    "dep-3": "Husky",
    "dep-4": "date-fns",
    "dep-5": "Discord.JS",
    "deps-more": "More dependencies can be found in the package.json file in the Cerus source code:",
    "planned": "Planned Features",
    "planned-p1": "These are a list of great features which we plan to incorporate",
    "planned-1": "Bot Discovery",
    "planned-2": "GitHub Deployment",
    "planned-3": "E-Mailed Errors and Reports",
    "stats-refresh": "Refresh",
    "stats": "Statistics & Service Information",
    "stats-bots": "Bots Online: {online} ({offline} offline)",
    "stats-users": "There are {total} user(s)",
    "stats-uptime": "Server has been online for {server}",
    "stats-mem": "{free} of memory is free out of {total} memory"
  }
}
</i18n>
<script lang="ts">
import { formatDistance } from 'date-fns'
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'

@Component({
  head() {
    return {
      title: this.$t('page-title').toString(),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$t('full-title', {
            page: this.$t('page-title'),
          }).toString(),
        },
      ],
    }
  },
  mounted() {
    ;(this as PageIndex).loadStats()
  },
})
export default class PageIndex extends Vue {
  stats: object = {
    bots: {
      online: 0,
      offline: 0,
    },
    users: {
      total: 0,
    },
    uptime: {
      server: 0,
      process: 0,
      system: 0,
    },
    memory: {
      free: 0,
      used: 0,
      total: 0,
    },
  }

  statsError: Error = null

  formatSize(size: number): string {
    const i = Math.floor(Math.log(size) / Math.log(1024))
    return (
      (size / Math.pow(1024, i)).toFixed(2) +
      ' ' +
      ['B', 'kB', 'MB', 'GB', 'TB'][i]
    )
  }

  formatMemory(obj: Record<string, number>): Record<string, string> {
    const obj2: Record<string, string> = {}
    for (const key in obj) {
      obj2[key] = this.formatSize(obj[key])
    }
    return obj2
  }

  loadStats() {
    this.statsError = null
    this.$axios
      .get('/api/v1/instance/stats')
      .then((res) => {
        this.stats = (res.data as BaseMessageInterface).data
      })
      .catch((e) => (this.statsError = e))
  }

  formatUptime(uptime: {
    server: number
    process: number
    system: number
  }): object {
    const server = new Date()
    server.setTime(uptime.server)
    return {
      server: formatDistance(server, 0),
      process: uptime.process,
      system: uptime.system,
    }
  }
}
</script>
