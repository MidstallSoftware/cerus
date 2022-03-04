import { createLocalVue, mount } from '@vue/test-utils'
import mockAxios from 'jest-mock-axios'
import Vuetify from 'vuetify'
import BotsNavigation from '../../components/BotsNavigation.vue'

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

  afterEach(() => {
    mockAxios.reset()
  })

  test('is a Vue instance', () => {
    const wrapper = mount(BotsNavigation, {
      localVue,
      vuetify,
      mocks: {
        $axios: mockAxios,
        $t: (key: string) => key,
      },
    })
    expect(wrapper.vm).toBeTruthy()
  })
})
