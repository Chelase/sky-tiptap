import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'

vi.mock('../components/BubbleMenu/BubbleMenu.vue', () => ({
  default: {
    name: 'BubbleMenuWrapper',
    props: ['editor'],
    render() {
      return h('div', { class: 'sky-bubble-menu' })
    },
  },
}))

import SkyTiptap from '../components/SkyTiptap.vue'

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect

describe('InsertMenu integration', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect() {
      if (this.classList?.contains('content-wrapper')) {
        return {
          top: 120,
          left: 120,
          right: 320,
          bottom: 144,
          width: 200,
          height: 24,
          x: 120,
          y: 120,
          toJSON: () => ({}),
        }
      }

      return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    document.body.innerHTML = ''
  })

  it('shows the insert menu when clicking the add button on an empty paragraph', async () => {
    const wrapper = mount(SkyTiptap, {
      attachTo: document.body,
      props: {
        modelValue: '<p></p>',
        showToolbar: false,
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 50))

    const paragraph = wrapper.find('.custom-paragraph')
    expect(paragraph.exists()).toBe(true)

    await paragraph.trigger('mouseenter')
    await nextTick()

    const addButton = wrapper.find('.add-button')
    expect(addButton.exists()).toBe(true)

    await addButton.trigger('mousedown')
    await addButton.trigger('click')
    await nextTick()
    await flushPromises()

    expect(wrapper.find('.sky-insert-menu').exists()).toBe(true)
  })
})
