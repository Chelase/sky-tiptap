import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import SkyTiptap from '../components/SkyTiptap.vue'

// Mock child components to avoid Tiptap editor complexity
vi.mock('../components/Toolbar/Toolbar.vue', () => ({
  default: {
    name: 'Toolbar',
    props: ['editor'],
    render() {
      return h('div', { class: 'sky-toolbar' }, 'Toolbar')
    }
  }
}))

vi.mock('../components/BubbleMenu/BubbleMenu.vue', () => ({
  default: {
    name: 'BubbleMenuWrapper',
    props: ['editor'],
    render() {
      return h('div', { class: 'sky-bubble-menu' }, 'BubbleMenu')
    }
  }
}))

vi.mock('../components/Toolbar/Menu/InsertMenu.vue', () => ({
  default: {
    name: 'InsertMenu',
    props: ['editor'],
    render() {
      return h('div', { class: 'sky-insert-menu' }, 'InsertMenu')
    }
  }
}))

// Mock Tiptap Vue3
vi.mock('@tiptap/vue-3', async () => {
  const actual = await vi.importActual('@tiptap/vue-3')
  return {
    ...actual,
    useEditor: (options) => {
      const editor = {
        getHTML: vi.fn(() => '<p>test</p>'),
        commands: {
          setContent: vi.fn()
        },
        chain: () => ({
          focus: () => ({
            setImage: () => ({ run: vi.fn() })
          }),
          setContent: () => ({ run: vi.fn() })
        }),
        isActive: vi.fn(() => false),
        can: () => ({
          undo: () => true,
          redo: () => true
        }),
        getAttributes: vi.fn(() => ({})),
        isDestroyed: false,
        destroy: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        state: {
          selection: { from: 0, to: 0 }
        },
        isFocused: false,
        view: {
          dom: document.createElement('div')
        },
        element: document.createElement('div'),
        options: {}
      }
      return { value: editor }
    },
    EditorContent: {
      name: 'EditorContent',
      props: ['editor'],
      render() {
        return h('div', { class: 'tiptap-editor-content' }, 'Editor Content')
      }
    },
    BubbleMenu: {
      name: 'BubbleMenu',
      props: ['editor', 'tippyOptions'],
      render() {
        return h('div', { class: 'tiptap-bubble-menu' }, 'Bubble Menu')
      }
    }
  }
})

describe('SkyTiptap Component', () => {
  beforeEach(() => {
    const div = document.createElement('div')
    div.id = 'app'
    document.body.appendChild(div)
  })

  afterEach(() => {
    const app = document.getElementById('app')
    if (app) app.remove()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('mounts with default props', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()
    expect(wrapper.find('.sky-tiptap-wrapper').exists()).toBe(true)
    expect(wrapper.find('.sky-editor').exists()).toBe(true)
  })

  it('renders Toolbar when showToolbar is true', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        showToolbar: true
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()
    await flushPromises()
    expect(wrapper.find('.sky-toolbar').exists()).toBe(true)
  })

  it('does not render Toolbar when showToolbar is false', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        showToolbar: false
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()
    expect(wrapper.find('.sky-toolbar').exists()).toBe(false)
  })

  it('sets data-theme attribute correctly', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        theme: 'dark'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()
    expect(wrapper.find('.sky-tiptap-wrapper').attributes('data-theme')).toBe('dark')
  })

  it('validates theme prop', () => {
    const props = SkyTiptap.props
    expect(props.theme.validator('default')).toBe(true)
    expect(props.theme.validator('dark')).toBe(true)
    expect(props.theme.validator('invalid')).toBe(false)
  })

  it('emits uploadPhoto on file change', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const input = wrapper.find('input[type="file"]')
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    Object.defineProperty(input.element, 'files', {
      value: [file]
    })

    await input.trigger('change')
    expect(wrapper.emitted('uploadPhoto')).toBeTruthy()
    expect(wrapper.emitted('uploadPhoto')[0][0]).toBeInstanceOf(File)
  })

  it('exposes insertImage, getContent, setContent methods', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(typeof wrapper.vm.insertImage).toBe('function')
    expect(typeof wrapper.vm.getContent).toBe('function')
    expect(typeof wrapper.vm.setContent).toBe('function')
  })
})
