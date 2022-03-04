import { createLocalVue, mount } from '@vue/test-utils'
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
        $t: (key: string) => key,
      },
    })
    expect(wrapper.vm).toBeTruthy()
  })
})
