import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import SkyTiptap from '../components/SkyTiptap.vue'
import { emitter } from '../utils/emitter'

const tiptapState = vi.hoisted(() => ({
  latestChain: null,
}))

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
      const run = vi.fn()
      const chain = {
        focus: vi.fn(() => chain),
        setImage: vi.fn(() => chain),
        setUploadedVideo: vi.fn(() => chain),
        insertContent: vi.fn(() => chain),
        insertContentAt: vi.fn(() => chain),
        setContent: vi.fn(() => chain),
        run,
      }
      tiptapState.latestChain = chain

      const editor = {
        getHTML: vi.fn(() => '<p>test</p>'),
        commands: {
          setContent: vi.fn()
        },
        chain: vi.fn(() => chain),
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

  it('does not render Toolbar by default', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()
    expect(wrapper.find('.sky-toolbar').exists()).toBe(false)
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

  it('emits uploadPhoto with a file array on file change', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const input = wrapper.find('input[type="file"]')
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    expect(input.attributes('multiple')).toBeDefined()

    Object.defineProperty(input.element, 'files', {
      value: [file]
    })

    await input.trigger('change')
    expect(wrapper.emitted('uploadPhoto')).toBeTruthy()
    expect(wrapper.emitted('uploadPhoto')[0][0]).toEqual([file])
  })

  it('emits uploadPhoto once with all selected files', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const input = wrapper.find('input[type="file"]')
    const files = [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ]

    Object.defineProperty(input.element, 'files', {
      value: files
    })

    await input.trigger('change')

    expect(wrapper.emitted('uploadPhoto')).toHaveLength(1)
    expect(wrapper.emitted('uploadPhoto')[0][0]).toEqual(files)
  })

  it('emits uploadVideo once with all selected files', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const input = wrapper.find('input[accept="video/*"]')
    const files = [
      new File(['first'], 'first.mp4', { type: 'video/mp4' }),
      new File(['second'], 'second.webm', { type: 'video/webm' }),
    ]

    expect(input.attributes('multiple')).toBeDefined()

    Object.defineProperty(input.element, 'files', {
      value: files
    })

    await input.trigger('change')

    expect(wrapper.emitted('uploadVideo')).toHaveLength(1)
    expect(wrapper.emitted('uploadVideo')[0][0]).toEqual(files)
  })

  it('exposes insertImage, insertImages, insertVideo, insertVideos, getContent, setContent methods', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(typeof wrapper.vm.insertImage).toBe('function')
    expect(typeof wrapper.vm.insertImages).toBe('function')
    expect(typeof wrapper.vm.insertVideo).toBe('function')
    expect(typeof wrapper.vm.insertVideos).toBe('function')
    expect(typeof wrapper.vm.insertGeneratedContent).toBe('function')
    expect(typeof wrapper.vm.getContent).toBe('function')
    expect(typeof wrapper.vm.setContent).toBe('function')
  })

  it('calls the configured AI API and inserts returned content', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        choices: [
          {
            message: {
              content: 'AI 返回内容',
            },
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          baseUrl: 'https://api.example.com/ai',
          apiKey: 'test-key',
          buildBody: (prompt) => ({
            model: 'gpt-5.2',
            input: [
              {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        },
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    emitter.emit('AI-generated')
    await nextTick()
    await flushPromises()

    const input = document.body.querySelector('.sky-dialog__input')
    input.value = '写一段介绍'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/ai', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: '写一段介绍',
              },
            ],
          },
        ],
      }),
    }))
    expect(tiptapState.latestChain.insertContentAt).toHaveBeenNthCalledWith(1, {
      from: 0,
      to: 0,
    }, expect.objectContaining({
      type: 'aiLoading',
      attrs: expect.objectContaining({
        id: expect.stringMatching(/^sky-ai-/),
      }),
    }))
    expect(tiptapState.latestChain.insertContentAt).toHaveBeenLastCalledWith({
      from: 0,
      to: 0,
    }, '<p>AI 返回内容</p>\n')
    expect(tiptapState.latestChain.run).toHaveBeenCalled()
  })

  it('streams AI markdown updates into the editor', async () => {
    const encoder = new TextEncoder()
    const fetchMock = vi.fn(async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: '## 标题' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: '\n\n正文' })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      }),
      text: vi.fn(),
    }))
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          baseUrl: 'https://api.example.com/ai',
          apiKey: 'test-key',
          buildBody: (prompt) => ({
            input: prompt,
            stream: true,
          }),
        },
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    emitter.emit('AI-generated')
    await nextTick()
    await flushPromises()

    const input = document.body.querySelector('.sky-dialog__input')
    input.value = '生成 markdown'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(tiptapState.latestChain.insertContentAt).toHaveBeenLastCalledWith({
      from: 0,
      to: 0,
    }, '<h2>标题</h2>\n<p>正文</p>\n')
  })

  it('removes AI loading content and shows an error dialog when generation fails', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => '服务异常',
    }))
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          baseUrl: 'https://api.example.com/ai',
          apiKey: 'test-key',
        },
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    emitter.emit('AI-generated')
    await nextTick()
    await flushPromises()

    const input = document.body.querySelector('.sky-dialog__input')
    input.value = '生成内容'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(tiptapState.latestChain.insertContentAt).toHaveBeenLastCalledWith({
      from: 0,
      to: 0,
    }, '')
    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('AI 生成失败')
    expect(document.body.querySelector('.sky-dialog__message').textContent).toBe('服务异常')
  })
})
