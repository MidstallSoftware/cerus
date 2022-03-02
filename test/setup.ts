import Vue from 'vue'
import Vuetify from 'vuetify'
import { library, IconPack } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas as IconPack)
/* eslint-disable vue/multi-word-component-names */
/* eslint-disable vue/component-definition-name-casing */
Vue.component('fa', FontAwesomeIcon)
Vue.use(Vuetify)
