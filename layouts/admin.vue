<template>
  <v-app dark>
    <v-app-bar app flat clipped-left>
      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>

    <client-only>
      <v-navigation-drawer app clipped permanent expand-on-hover>
        <v-navigation-drawer
          absolute
          mini-variant
          mini-variant-width="56"
          permanent
        >
          <v-list>
            <v-list-item
              v-for="(link, index) in Object.values(links)"
              :key="index"
              link
            >
              <a :href="link.href" class="text--primary">
                <fa :icon="link.icon" />
              </a>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        <v-list class="pl-15">
          <v-list-item
            v-for="(link, index) in currentLink.sublinks"
            :key="index"
            link
          >
            <a :href="link.href" class="text--primary">
              {{ $t(link.title) }}
            </a>
          </v-list-item>
        </v-list>
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
    "admin-home": "Home",
    "admin-home-stats": "Statistics"
  }
}
</i18n>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

interface Sublink {
  title: string
  href: string
}

interface Link {
  icon: string[]
  href: string
  sublinks?: Sublink[]
}

@Component
export default class LayoutAdmin extends Vue {
  drawer: boolean = true
  links: Record<string, Link> = {
    admin: {
      icon: ['fas', 'house'],
      href: '/admin',
      sublinks: [
        {
          title: 'admin-home-stats',
          href: '/admin/#stats',
        },
      ],
    },
  }

  get currentLink(): Link {
    return this.links[this.titleKey]
  }

  get titleKey(): string {
    return this.$route.name.split('___', 2)[0]
  }

  get title(): string {
    const titleGen: Record<string, () => string> = {
      admin: () => this.$t('admin-home').toString(),
    }

    if (this.titleKey in titleGen) {
      return titleGen[this.titleKey]()
    }
    return ''
  }
}
</script>
