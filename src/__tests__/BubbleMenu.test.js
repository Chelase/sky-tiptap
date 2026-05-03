import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import BubbleMenuWrapper from '../components/BubbleMenu/BubbleMenu.vue'
import { emitter } from '../utils/emitter'

vi.mock('@tiptap/vue-3', () => ({
  BubbleMenu: defineComponent({
    name: 'BubbleMenu',
    props: ['editor', 'tippyOptions'],
    setup(_, { slots }) {
      return () => h('div', { class: 'mock-bubble-menu' }, slots.default?.())
    },
  }),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

const createCommandChain = () => {
  const run = vi.fn()
  const chain = {
    focus: vi.fn(() => chain),
    toggleBold: vi.fn(() => chain),
    toggleItalic: vi.fn(() => chain),
    toggleUnderline: vi.fn(() => chain),
    toggleStrike: vi.fn(() => chain),
    toggleHeading: vi.fn(() => chain),
    toggleBulletList: vi.fn(() => chain),
    toggleOrderedList: vi.fn(() => chain),
    extendMarkRange: vi.fn(() => chain),
    setLink: vi.fn(() => chain),
    unsetLink: vi.fn(() => chain),
    run,
  }

  return chain
}

const createEditor = () => {
  const chain = createCommandChain()

  return {
    chain: vi.fn(() => chain),
    getAttributes: vi.fn(() => ({})),
    isActive: vi.fn(() => false),
    __chain: chain,
  }
}

describe('BubbleMenuWrapper', () => {
  it('renders heading and list controls in the bubble menu', () => {
    const editor = createEditor()
    const wrapper = mount(BubbleMenuWrapper, {
      props: { editor },
    })

    expect(wrapper.text()).toContain('H1')
    expect(wrapper.text()).toContain('H2')
    expect(wrapper.text()).toContain('H3')
    expect(wrapper.find('[title="无序列表"]').exists()).toBe(true)
    expect(wrapper.find('[title="有序列表"]').exists()).toBe(true)
  })

  it('toggles headings and lists from the bubble menu', async () => {
    const editor = createEditor()
    const wrapper = mount(BubbleMenuWrapper, {
      props: { editor },
    })

    await wrapper.find('[title="一级标题"]').trigger('click')
    await wrapper.find('[title="无序列表"]').trigger('click')
    await wrapper.find('[title="有序列表"]').trigger('click')

    expect(editor.__chain.toggleHeading).toHaveBeenCalledWith({ level: 1 })
    expect(editor.__chain.toggleBulletList).toHaveBeenCalled()
    expect(editor.__chain.toggleOrderedList).toHaveBeenCalled()
    expect(editor.__chain.run).toHaveBeenCalledTimes(3)
  })

  it('opens the unified dialog when setting a link', async () => {
    const editor = createEditor()
    editor.getAttributes.mockReturnValue({ href: 'https://example.com' })
    const emitSpy = vi.spyOn(emitter, 'emit')
    const wrapper = mount(BubbleMenuWrapper, {
      props: { editor },
    })

    await wrapper.find('[title="链接"]').trigger('click')

    expect(emitSpy).toHaveBeenCalledWith('open-dialog', expect.objectContaining({
      mode: 'input',
      title: '设置链接',
      defaultValue: 'https://example.com',
    }))

    const dialogOptions = emitSpy.mock.calls.find(([eventName]) => eventName === 'open-dialog')[1]
    dialogOptions.onConfirm('https://next.example.com')

    expect(editor.__chain.setLink).toHaveBeenCalledWith({ href: 'https://next.example.com' })
    expect(editor.__chain.run).toHaveBeenCalled()
  })

  it('unsets the link when unified dialog confirms an empty value', async () => {
    const editor = createEditor()
    const emitSpy = vi.spyOn(emitter, 'emit')
    const wrapper = mount(BubbleMenuWrapper, {
      props: { editor },
    })

    await wrapper.find('[title="链接"]').trigger('click')

    const dialogOptions = emitSpy.mock.calls.find(([eventName]) => eventName === 'open-dialog')[1]
    dialogOptions.onConfirm('')

    expect(editor.__chain.unsetLink).toHaveBeenCalled()
    expect(editor.__chain.setLink).not.toHaveBeenCalled()
  })
})
