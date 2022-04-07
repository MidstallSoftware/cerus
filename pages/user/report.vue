<template>
  <div>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
      <v-combobox
        v-model="typeName"
        :items="reportTypes"
        placeholder="Type of report"
        required
      />
      <v-text-field v-model="botId" :label="$t('bot-id')" required />
      <v-text-field v-model="title" :label="$t('title')" required />
      <v-textarea v-model="content" :label="$t('content')" required />
      <v-file-input v-model="files" :label="$t('attachments')" required>
        <template #selection="{ index, text }">
          <v-chip
            v-if="index < 2"
            color="deep-purple accent-4"
            dark
            label
            small
          >
            {{ text }}
          </v-chip>
          <span
            v-else-if="index === 2"
            class="text-overline grey--text text--darken-3 mx-2"
          >
            +{{ files.length - 2 }} {{ $t('files') }}
          </span>
        </template>
      </v-file-input>
      <v-btn type="submit" :disabled="!valid" @click="submit">
        {{ $t('submit') }}
      </v-btn>
    </v-form>
    <v-snackbar v-model="snackbar" top>
      {{ snackbarMessage }}
      <template #action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
          {{ $t('close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<i18n>
{
  "en": {
    "page-title": "Report a bot",
    "submit": "Submit",
    "title": "Title",
    "bot-id": "Discord Bot ID",
    "content": "Content",
    "files": "File(s)",
    "close": "Close",
    "attachments": "Attachments",
    "submitted": "Successfully submitted report"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

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
  mounted() {
    ;(this as PageUserReport).files = []
    this.$axios.$get('/api/v1/instance/info').then((res) => {
      ;(this as PageUserReport).reportTypes = res.data.constants.reportTypes
    })
  },
})
export default class PageUserReport extends Vue {
  error: Error = null
  valid = false
  typeName: string = null
  title: string = ''
  content: string = ''
  botId: string = ''
  reportTypes: string[] = []
  files: Blob | Blob[] = []
  snackbar: boolean = false
  snackbarMessage: string = ''

  submit(e: Event) {
    e.preventDefault()
    this.error = null
    this.snackbar = false

    if ((this.$refs.form as any).validate()) {
      const formData = new FormData()
      if (Array.isArray(this.files)) {
        for (const f of this.files.filter((v) => v !== null))
          formData.append('files', f)
      } else {
        formData.append('files', this.files)
      }
      this.$axios
        .post(
          `/api/v1/reports?type=${encodeURIComponent(
            this.typeName
          )}&botId=${encodeURIComponent(this.botId)}&title=${encodeURIComponent(
            this.title
          )}&content=${encodeURIComponent(this.content)}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        .then(() => {
          this.snackbar = true
          this.snackbarMessage = this.$t('submitted').toString()
          this.typeName = null
          this.title = ''
          this.content = ''
          this.files = []
        })
        .catch(
          (e) =>
            (this.error = e.response ? { message: e.response.data.detail } : e)
        )
    }
  }
}
</script>
