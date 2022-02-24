<template>
  <v-app dark>
    <v-main style="padding-top: 16px">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="6">
          <v-card>
            <v-card-title>
              <span v-if="error.statusCode === 404">
                {{ pageNotFound }}
              </span>
              <span v-else>
                {{ otherError }}
              </span>
            </v-card-title>
            <v-card-text>
              <p>
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
<script>
export default {
  name: 'ErrorLayout',
  layout: 'empty',
  props: {
    error: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      pageNotFound: '404 Not Found',
      otherError: 'An error occurred',
    }
  },
  head() {
    const title =
      this.error.statusCode === 404 ? this.pageNotFound : this.otherError
    return {
      title,
    }
  },
}
</script>
