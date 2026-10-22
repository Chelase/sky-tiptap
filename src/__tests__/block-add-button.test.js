import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import BlockAddButton from '../components/BlockControls/BlockAddButton.vue'
import { emitter } from '../utils/emitter'

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect

describe('BlockAddButton', () => {
  let editor = null

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      top: 100,
      left: 300,
      right: 500,
      bottom: 128,
      width: 200,
      height: 28,
      x: 300,
      y: 100,
      toJSON: () => ({}),
    }))
  })

  afterEach(() => {
    editor?.destroy?.()
    editor = null
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  const createEditor = () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: '<p>first</p><p>second</p>',
    })

    editor.view.posAtCoords = vi.fn(() => ({ pos: 2, inside: 2 }))
    return editor
  }

  it('shows the add button when hovering a top level block', async () => {
    const activeEditor = createEditor()
    const wrapper = mount(BlockAddButton, {
      attachTo: document.body,
      props: { editor: activeEditor },
    })

    await nextTick()

    const button = wrapper.find('.sky-block-add-button')
    expect(button.exists()).toBe(true)
    expect(button.isVisible()).toBe(false)

    activeEditor.view.dom.dispatchEvent(new MouseEvent('mousemove', { clientX: 320, clientY: 110 }))
    await new Promise((resolve) => setTimeout(resolve, 40))
    await nextTick()

    expect(button.isVisible()).toBe(true)

    wrapper.unmount()
  })

  it('opens the insert menu with an insert callback when clicked', async () => {
    const activeEditor = createEditor()
    const listener = vi.fn()
    emitter.on('show-insert-menu', listener)

    const wrapper = mount(BlockAddButton, {
      attachTo: document.body,
      props: { editor: activeEditor },
    })

    await nextTick()
    activeEditor.view.dom.dispatchEvent(new MouseEvent('mousemove', { clientX: 320, clientY: 110 }))
    await new Promise((resolve) => setTimeout(resolve, 40))
    await nextTick()

    await wrapper.find('.sky-block-add-button').trigger('click')
    await nextTick()

    expect(listener).toHaveBeenCalled()
    const payload = listener.mock.calls[0][0]
    expect(typeof payload.insert).toBe('function')
    expect(payload.position).toHaveProperty('left')

    emitter.off('show-insert-menu', listener)
    wrapper.unmount()
  })
})
