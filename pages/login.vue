<template>
  <div style="padding-top: 25px">
    <v-row justify="center" align="start">
      <v-col cols="12" md="10" lg="8" xl="8">
        <v-card>
          <v-alert v-if="$auth.error" type="error">
            {{ $auth.error.message }}
          </v-alert>
          <v-card-title>{{ $t('login') }}</v-card-title>
          <v-card-text>{{ $t('nouser.message') }}</v-card-text>
          <v-card-actions>
            <v-btn id="login" @click="doLogin">
              {{ $t('login') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<i18n>
{
  "en": {
    "login": "Log In",
    "nouser.message": "Please click the button below to log in with Discord"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  head() {
    return {
      title: this.$t('login').toString(),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$t('full-title', { page: this.$t('login') }).toString(),
        },
      ],
    }
  },
  mounted() {
    if (this.$auth.loggedIn && process.client) window.location.assign('/user')
  },
})
export default class PageLogin extends Vue {
  doLogin() {
    this.$auth.loginWith('discord')
  }
}
</script>
