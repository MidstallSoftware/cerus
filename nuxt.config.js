import colors from 'vuetify/es5/util/colors'

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head() {
    const i18nHead = this.$nuxtI18nHead({ addSeoAttributes: true })
    return {
      titleTemplate: this.$t('full-title', { page: '%s' }),
      title: this.$t('default-title'),
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$t('default-title'),
        },
        {
          hid: 'description',
          name: 'description',
          content: this.$t('default-desc'),
        },
        { name: 'format-detection', content: 'telephone=no' },
        ...i18nHead.meta,
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        ...i18nHead.link,
      ],
    }
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    { src: 'vue-prism-editor/dist/prismeditor.min.css', lang: 'css' },
    { src: 'prismjs/themes/prism-tomorrow.css', lang: 'css' },
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [{ src: '~/plugins/vue-apexcharts.ts', mode: 'client' }],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,
  store: true,
  ssr: true,

  serverMiddleware: [{ path: '/api', handler: '~/api/index.ts' }],

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
    '@nuxtjs/fontawesome',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    '@nuxtjs/auth-next',
    '@nuxtjs/i18n',
  ],

  auth: {
    strategies: {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      },
    },
    redirect: {
      home: '/user',
    },
  },

  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
      },
    ],
    defaultLocale: 'en',
    vueI18nLoader: true,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        en: {
          'full-title': '{page} - Cerus',
          'default-title': 'Cerus',
          'default-desc':
            'Cerus is a Discord bot hosting platform, developed and operated by Midstall Software. It aims to provide ease of use and accurate data to operate bots for Discord.',
        },
      },
    },
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/',
  },

  publicRuntimeConfig: {
    axios: {
      browserBaseURL: process.env.BROWSER_BASE_URL || 'http://localhost:8087',
    },
  },

  privateRuntimeConfig: {
    axios: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    },
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en',
    },
  },

  fontawesome: {
    component: 'fa',
    icons: {
      solid: [
        'faSmile',
        'faBars',
        'faLanguage',
        'faPlus',
        'faXmark',
        'faCheck',
      ],
      brands: ['faGithub'],
    },
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    treeShake: true,
    defaultAssets: {
      icons: 'fa',
    },
    icons: {
      iconfont: 'faSvg',
    },
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
    },
  },

  vue: {
    config: {
      productionTip: true,
      devtools: true,
      silent: false,
      performance: true,
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
}
