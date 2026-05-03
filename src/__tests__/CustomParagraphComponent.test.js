import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import CustomParagraphComponent from '../components/CustomParagraphComponent.vue'
import { emitter } from '../utils/emitter'

vi.mock('@tiptap/vue-3', () => ({
  NodeViewWrapper: defineComponent({
    name: 'NodeViewWrapper',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.())
    },
  }),
  NodeViewContent: defineComponent({
    name: 'NodeViewContent',
    setup() {
      return () => h('div', { 'data-node-view-content': '' })
    },
  }),
}))

const createEditor = () => ({
  state: {
    selection: {
      from: 1,
      to: 1,
    },
  },
  isFocused: true,
})

describe('CustomParagraphComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('emits show-insert-menu for empty paragraphs without relying on an inner p element', async () => {
    const emitSpy = vi.spyOn(emitter, 'emit')

    const wrapper = mount(CustomParagraphComponent, {
      attachTo: document.body,
      props: {
        editor: createEditor(),
        node: { nodeSize: 2 },
        decorations: [],
        selected: false,
        extension: {},
        getPos: () => 1,
        updateAttributes: vi.fn(),
        deleteNode: vi.fn(),
      },
    })

    const anchor = wrapper.find('[data-node-view-content]').element
    Object.defineProperty(anchor, 'getBoundingClientRect', {
      value: () => ({
        top: 120,
        left: 80,
        right: 80,
        bottom: 120,
        width: 0,
        height: 0,
        x: 80,
        y: 120,
        toJSON: () => ({}),
      }),
    })

    await wrapper.find('.custom-paragraph').trigger('mouseenter')
    await nextTick()
    await wrapper.find('.add-button').trigger('click')

    expect(emitSpy).toHaveBeenCalledWith(
      'show-insert-menu',
      expect.objectContaining({
        position: {
          top: 136,
          left: 40,
        },
        insert: expect.any(Function),
      }),
    )
  })
})
