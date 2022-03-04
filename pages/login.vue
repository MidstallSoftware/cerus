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
  head: {
    title: 'Log In',
    meta: [{ hid: 'og:title', name: 'og:title', content: 'Log In - Cerus' }],
  },
})
export default class PageLogin extends Vue {
  created() {
    if (this.$auth.loggedIn && process.client) window.location.assign('/user')
  }

  doLogin() {
    this.$auth.loginWith('discord')
  }
}
</script>
