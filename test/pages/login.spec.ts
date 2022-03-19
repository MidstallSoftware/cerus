import { createLocalVue, mount, Wrapper } from '@vue/test-utils'
import { CombinedVueInstance } from 'vue/types/vue'
import mockAxios from 'jest-mock-axios'
import Vuetify from 'vuetify'
import PageLogin from '../../pages/login.vue'

describe('PageLogin', () => {
  const localVue = createLocalVue()
  let vuetify: Vuetify
  let wrapper: Wrapper<
    CombinedVueInstance<PageLogin, object, object, object, Record<never, any>>
  >

  beforeEach(() => {
    vuetify = new Vuetify({
      icons: {
        iconfont: 'faSvg',
      },
    })
    wrapper = mount(PageLogin, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          loggedIn: false,
          error: null,
          loginWith: () => {},
        },
        $axios: mockAxios,
        $t: (key: string) => key,
      },
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  test('is a Vue instance', () => {
    expect(wrapper.vm).toBeTruthy()
  })

  test('login with discord', () => {
    const loginBtn = wrapper.findComponent({ name: 'v-btn' })
    expect(loginBtn.exists()).toBeTruthy()
    loginBtn.trigger('click')
  })
})
