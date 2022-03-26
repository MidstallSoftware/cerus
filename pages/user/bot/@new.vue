<template>
  <div>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
      <v-text-field
        v-model="id"
        name="id"
        :label="$t('discord-id')"
        required
        full-width
        outlined
      />
      <v-text-field
        v-model="token"
        name="token"
        :label="$t('discord-token')"
        required
        type="password"
        full-width
        outlined
      />
      <v-btn type="submit" :disabled="!valid" @click="submit">
        {{ $t('submit') }}
      </v-btn>
    </v-form>
  </div>
</template>
<i18n>
{
  "en": {
    "title": "New Bot",
    "discord-id": "Discord ID",
    "discord-token": "Discord Bot Token",
    "submit": "Submit"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  head() {
    return {
      title: this.$t('title').toString(),
    }
  },
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotNew extends Vue {
  valid: boolean = false
  id: string = ''
  token: string = ''
  error?: Error | null = null

  submit(e: Event) {
    e.preventDefault()
    this.error = null
    if ((this.$refs.form as any).validate()) {
      this.$axios
        .post(`/api/v1/bots?discordId=${this.id}&token=${this.token}`)
        .then((res) => {
          this.$router.push('/user/bot/' + res.data.data.id)
        })
        .catch((e) => (this.error = e))
    }
  }
}
</script>
