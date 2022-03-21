<template>
  <div style="padding-top: 25px">
    <v-row v-if="error != null">
      <v-col cols="12">
        <v-alert type="error">{{ error.message }}</v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-alert v-show="typeof userInfo != 'object'" type="success" dense>
          {{ $t('loading') }}
        </v-alert>
        <v-card>
          <v-card-title>{{ $t('settings') }}</v-card-title>
          <v-card-text>
            <v-btn color="red" @click="deleteUser">
              {{ $t('delete-user') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<i18n>
{
  "en": {
    "loading": "Loading... please wait",
    "page-title": "User",
    "settings": "User Settings",
    "delete-user": "Delete User"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

interface UserInfo {}

@Component({
  middleware: 'auth',
  layout: 'user',
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
})
export default class PageUserIndex extends Vue {
  userInfo: UserInfo = {}
  error: Error = null

  created() {
    this.error = null
    this.$axios
      .get('/api/v1/user')
      .then((res) => (this.userInfo = res.data.data))
      .catch((e) => (this.error = e))
  }

  deleteUser() {
    this.error = null
    this.$axios
      .$delete('/api/v1/user')
      .then(() => this.$auth.logout())
      .catch((e) => (this.error = e))
  }
}
</script>
