<template>
  <v-app dark>
    <v-main style="padding-top: 16px">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="6">
          <v-card>
            <v-card-title>
              <span>
                {{ errorName }}
              </span>
            </v-card-title>
            <v-card-text>
              <p v-if="errorMessage">
                {{ errorMessage }}
              </p>
              <p v-else>
                It looks like the page you were trying to access is unavailable.
                Please try again or go to a different page. For further
                informations or to report this problem, check out the
                <a
                  href="https://github.com/MidstallSoftware/cerus"
                  class="text--primary"
                  >GitHub repository</a
                >
                for this website.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>
<i18n>
{
  "en": {
    "file-not-found": "404 Not Found",
    "default-error": "An error occurred"
  }
}
</i18n>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
  layout: 'empty',
  head() {
    return {
      title: (this as LayoutError).errorName.toString(),
    }
  },
})
export default class LayoutError extends Vue {
  error: { statusCode?: number; message?: string } = {}

  get errorName() {
    return this.$t(
      this.error.statusCode === 404 ? 'file-not-found' : 'default-error'
    )
  }

  get errorMessage() {
    return typeof this.error.message !== 'undefined' ? this.error.message : null
  }
}
</script>
