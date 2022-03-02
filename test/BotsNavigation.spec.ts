import { createLocalVue, mount } from '@vue/test-utils'
import Vuetify from 'vuetify'
import BotsNavigation from '../components/BotsNavigation.vue'

describe('BotsNavigation', () => {
  const localVue = createLocalVue()
  let vuetify: Vuetify

  beforeEach(() => {
    vuetify = new Vuetify({
      icons: {
        iconfont: 'faSvg',
      },
    })
  })

  test('is a Vue instance', () => {
    const wrapper = mount(BotsNavigation, {
      localVue,
      vuetify,
      mocks: {
        $t: (key: string) => key,
      },
    })
    expect(wrapper.vm).toBeTruthy()
  })
})
