import { mount } from '@vue/test-utils'
import BotsNavigation from '@/components/BotsNavigation.vue'

describe('BotsNavigation', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(BotsNavigation)
    expect(wrapper.vm).toBeTruthy()
  })
})
