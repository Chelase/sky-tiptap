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

  it('keeps the add button while the pointer moves onto the block controls', async () => {
    const activeEditor = createEditor()
    const wrapper = mount(BlockAddButton, {
      attachTo: document.body,
      props: { editor: activeEditor },
    })

    await nextTick()
    activeEditor.view.dom.dispatchEvent(new MouseEvent('mousemove', { clientX: 320, clientY: 110 }))
    await new Promise((resolve) => setTimeout(resolve, 40))
    await nextTick()

    const button = wrapper.find('.sky-block-add-button')
    expect(button.isVisible()).toBe(true)

    // 移向「+」号 / 拖拽手柄时不能隐藏
    activeEditor.view.dom.dispatchEvent(
      new MouseEvent('mouseleave', { relatedTarget: document.createElement('div') }),
    )
    await nextTick()
    expect(button.isVisible()).toBe(false)

    activeEditor.view.dom.dispatchEvent(new MouseEvent('mousemove', { clientX: 320, clientY: 110 }))
    await new Promise((resolve) => setTimeout(resolve, 40))
    await nextTick()
    expect(button.isVisible()).toBe(true)

    const addControl = document.createElement('button')
    addControl.className = 'sky-block-add-button'
    document.body.appendChild(addControl)

    activeEditor.view.dom.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: addControl }))
    await nextTick()
    expect(button.isVisible()).toBe(true)

    const handleControl = document.createElement('div')
    handleControl.className = 'sky-drag-handle-wrapper'
    const handle = document.createElement('div')
    handle.className = 'sky-drag-handle'
    handleControl.appendChild(handle)
    document.body.appendChild(handleControl)

    activeEditor.view.dom.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: handle }))
    await nextTick()
    expect(button.isVisible()).toBe(true)

    // 真正离开编辑器时仍然隐藏
    activeEditor.view.dom.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: document.body }))
    await nextTick()
    expect(button.isVisible()).toBe(false)

    wrapper.unmount()
  })

  it('hides the add button when the pointer leaves it for outside the editor', async () => {
    const activeEditor = createEditor()
    const wrapper = mount(BlockAddButton, {
      attachTo: document.body,
      props: { editor: activeEditor },
    })

    await nextTick()
    activeEditor.view.dom.dispatchEvent(new MouseEvent('mousemove', { clientX: 320, clientY: 110 }))
    await new Promise((resolve) => setTimeout(resolve, 40))
    await nextTick()

    const button = wrapper.find('.sky-block-add-button')
    expect(button.isVisible()).toBe(true)

    // 从「+」号回到正文：保持可见
    await button.trigger('mouseleave', { relatedTarget: activeEditor.view.dom })
    await nextTick()
    expect(button.isVisible()).toBe(true)

    // 从「+」号离开编辑器：隐藏
    await button.trigger('mouseleave', { relatedTarget: document.body })
    await nextTick()
    expect(button.isVisible()).toBe(false)

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
