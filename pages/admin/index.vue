<template>
  <div></div>
</template>
<i18n>
{
  "en": {
    "page-title": "Home - Admin"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { BaseMessageInterface } from '~/api/message'
import { APIUser } from '~/api/types'

@Component({
  middleware: 'auth',
  layout: 'admin',
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
    this.$axios
      .get('/api/v1/user')
      .then((res) => {
        const data = (res.data as BaseMessageInterface).data as APIUser
        if (data.type !== 'admin') {
          throw new Error('Admin access is required')
        }
      })
      .catch((e) =>
        this.$nuxt.error({
          statusCode: 501,
          message: e.message,
        })
      )
  },
})
export default class PageAdminIndex extends Vue {}
</script>
