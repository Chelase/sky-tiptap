import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { EditorView } from '@tiptap/pm/view'

vi.mock('../components/BubbleMenu/BubbleMenu.vue', () => ({
  default: {
    name: 'BubbleMenuWrapper',
    props: ['editor'],
    render() {
      return h('div', { class: 'sky-bubble-menu' })
    },
  },
}))

vi.mock('@tiptap/extension-drag-handle-vue-3', () => ({
  DragHandle: {
    name: 'DragHandle',
    props: ['editor'],
    render() {
      return h('div', { class: 'tiptap-drag-handle' }, this.$slots.default?.())
    }
  }
}))

import SkyTiptap from '../components/SkyTiptap.vue'

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
const originalPosAtCoords = EditorView.prototype.posAtCoords

describe('block add button integration', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      top: 120,
      left: 200,
      right: 400,
      bottom: 148,
      width: 200,
      height: 28,
      x: 200,
      y: 120,
      toJSON: () => ({}),
    }))

    EditorView.prototype.posAtCoords = vi.fn(() => ({ pos: 1, inside: 1 }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    EditorView.prototype.posAtCoords = originalPosAtCoords
    document.body.innerHTML = ''
  })

  it('shows the block add button on hover and opens the insert menu on click', async () => {
    const wrapper = mount(SkyTiptap, {
      attachTo: document.body,
      props: {
        modelValue: '<p>hello</p>',
        showToolbar: false,
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 50))

    const prosemirror = wrapper.find('.ProseMirror')
    expect(prosemirror.exists()).toBe(true)

    prosemirror.element.dispatchEvent(new MouseEvent('mousemove', { clientX: 220, clientY: 130 }))
    await new Promise((resolve) => setTimeout(resolve, 60))
    await nextTick()

    const addButton = wrapper.find('.sky-block-add-button')
    expect(addButton.exists()).toBe(true)
    expect(addButton.isVisible()).toBe(true)

    await addButton.trigger('click')
    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('.sky-insert-menu')).toBeTruthy()

    wrapper.unmount()
  })
})
