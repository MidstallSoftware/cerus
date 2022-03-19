import { createLocalVue, mount } from '@vue/test-utils'
import mockAxios from 'jest-mock-axios'
import Vuetify from 'vuetify'
import PageIndex from '../../pages/index.vue'

describe('PageIndex', () => {
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
    const wrapper = mount(PageIndex, {
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
