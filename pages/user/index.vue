<template>
  <div style="padding-top: 25px">
    <v-row justify="center" align="start">
      <v-col cols="12" md="10" lg="8" xl="8">
        <v-alert v-if="typeof userInfo != 'object'" type="success" dense>
          {{ $t('loading') }}
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>
<i18n>
{
  "en": {
    "loading": "Loading... please wait",
    "page-title": "User"
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
  userInfo: UserInfo = null

  created() {
    this.$axios.get('/api/v1/user').then((res) => (this.userInfo = res.data))
  }
}
</script>
