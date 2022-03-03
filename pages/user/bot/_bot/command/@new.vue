<template>
  <div>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-alert v-if="error != null" type="error">{{ error.message }}</v-alert>
      <v-btn type="submit" :disabled="!valid" @click="submit">
        {{ $t('submit') }}
      </v-btn>
    </v-form>
  </div>
</template>
<i18n>
{
  "en": {
    "submit": "Submit"
  }
}
</i18n>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  middleware: 'auth',
  layout: 'user',
})
export default class PageUserBotCommandNew extends Vue {
  valid: boolean = false
  error?: Error | null = null

  submit(e: Event) {
    e.preventDefault()
    this.error = null
  }
}
</script>
