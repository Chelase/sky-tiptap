import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import SkyTiptap from '../components/SkyTiptap.vue'
import { emitter } from '../utils/emitter'

const tiptapState = vi.hoisted(() => ({
  latestChain: null,
  latestEditor: null,
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

// Mock DragHandle component
vi.mock('@tiptap/extension-drag-handle-vue-3', () => ({
  DragHandle: {
    name: 'DragHandle',
    props: ['editor'],
    render() {
      return h('div', { class: 'tiptap-drag-handle' }, this.$slots.default?.())
    }
  }
}))

const countTopLevelBlocks = (content = '') => {
  const trimmed = String(content).trim()
  if (!trimmed) return 0
  const parsed = new DOMParser().parseFromString(trimmed, 'text/html')
  return parsed.body.children.length || 1
}

// Mock Tiptap Vue3
vi.mock('@tiptap/vue-3', async () => {
  const actual = await vi.importActual('@tiptap/vue-3')
  return {
    ...actual,
    useEditor: (options) => {
      const childCount = countTopLevelBlocks(options.content)
      const run = vi.fn(() => true)
      const chain = {
        focus: vi.fn(() => chain),
        setImage: vi.fn(() => chain),
        setUploadedVideo: vi.fn(() => chain),
        insertContent: vi.fn(() => chain),
        insertContentAt: vi.fn(() => chain),
        insertTable: vi.fn(() => chain),
        extendMarkRange: vi.fn(() => chain),
        toggleBulletList: vi.fn(() => chain),
        toggleOrderedList: vi.fn(() => chain),
        setLink: vi.fn(() => chain),
        unsetLink: vi.fn(() => chain),
        setHorizontalRule: vi.fn(() => chain),
        setImage: vi.fn(() => chain),
        setUploadedVideo: vi.fn(() => chain),
        setBilibiliVideo: vi.fn(() => chain),
        setYoutubeVideo: vi.fn(() => chain),
        setDouyinVideo: vi.fn(() => chain),
        setIframe: vi.fn(() => chain),
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
          selection: { from: 0, to: 0 },
          doc: {
            childCount,
            descendants: vi.fn()
          }
        },
        isFocused: false,
        view: {
          dom: document.createElement('div')
        },
        element: document.createElement('div'),
        options: {}
      }
      tiptapState.latestEditor = editor
      options.onCreate?.({ editor })
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

  it('does not render drag handle for a single top-level block', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(wrapper.find('.drag-handle').exists()).toBe(false)
  })

  it('renders drag handle for multiple top-level blocks', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p><p>World</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(wrapper.find('.drag-handle').exists()).toBe(true)
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

  it('executes structured AI actions when aiConfig mode is actions', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        mode: 'actions',
        actions: [
          {
            type: 'setHeading',
            params: {
              level: 2,
              text: '项目计划',
            },
          },
          {
            type: 'insertTable',
            params: {
              rows: 3,
              cols: 4,
              withHeaderRow: true,
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
          mode: 'actions',
          baseUrl: 'https://api.example.com/ai-actions',
          apiKey: 'test-key',
          buildBody: (prompt) => ({
            prompt,
            stream: false,
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
    input.value = '请执行结构化操作'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/ai-actions', expect.objectContaining({
      body: JSON.stringify({
        prompt: '请执行结构化操作',
        stream: false,
      }),
    }))
    expect(tiptapState.latestChain.insertContentAt).toHaveBeenNthCalledWith(1, {
      from: 0,
      to: 0,
    }, expect.objectContaining({
      type: 'aiLoading',
    }))
    expect(tiptapState.latestChain.insertContentAt).toHaveBeenNthCalledWith(2, {
      from: 0,
      to: 0,
    }, '')
    expect(tiptapState.latestChain.insertContent).toHaveBeenCalledWith({
      type: 'heading',
      attrs: {
        level: 2,
      },
      content: [
        {
          type: 'text',
          text: '项目计划',
        },
      ],
    })
    expect(tiptapState.latestChain.insertTable).toHaveBeenCalledWith({
      rows: 3,
      cols: 4,
      withHeaderRow: true,
    })
  })

  it('executes clear local editor intent without calling the AI API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '插入抖音视频：https://www.douyin.com/video/7633060374058167217'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(tiptapState.latestChain.insertContentAt).toHaveBeenNthCalledWith(2, {
      from: 0,
      to: 0,
    }, '')
    expect(tiptapState.latestChain.setDouyinVideo).toHaveBeenCalledWith({
      src: 'https://www.douyin.com/video/7633060374058167217',
    })
  })

  it('opens a project-owned prompt when local editor intent misses required data', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '插入抖音视频'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('插入抖音视频')
    expect(document.body.querySelector('.sky-dialog__input').getAttribute('placeholder')).toBe('https://www.douyin.com/video/7635170198135278902')
  })

  it('shows an operation error when actions mode cannot resolve AI text into actions', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '这是一段普通内容，不包含编辑器操作',
    }))
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '请判断要做什么'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('AI 操作失败')
    expect(document.body.querySelector('.sky-dialog__message').textContent).toBe('未识别到可执行的编辑器操作')
  })

  it('falls back to inserting markdown content in auto mode when no action is resolved', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '## 自动内容\n\n正文',
    }))
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'auto',
          baseUrl: 'https://api.example.com/ai-auto',
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
    input.value = '写一段普通内容'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(tiptapState.latestChain.insertContentAt).toHaveBeenLastCalledWith({
      from: 0,
      to: 0,
    }, '<h2>自动内容</h2>\n<p>正文</p>\n')
  })

  it('triggers local file pickers from structured AI upload actions', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        mode: 'actions',
        actions: [
          {
            type: 'requestImageUpload',
          },
          {
            type: 'requestVideoUpload',
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '上传图片和视频'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(clickSpy).toHaveBeenCalledTimes(2)
    clickSpy.mockRestore()
  })

  it('previews resolved actions and executes only after confirmation', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          previewActions: true,
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '插入抖音视频：https://www.douyin.com/video/7633060374058167217'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('确认执行操作')
    expect(document.body.querySelector('.sky-dialog__message').textContent).toContain('1. 插入抖音视频')
    expect(tiptapState.latestChain.setDouyinVideo).not.toHaveBeenCalled()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(tiptapState.latestChain.setDouyinVideo).toHaveBeenCalledWith({
      src: 'https://www.douyin.com/video/7633060374058167217',
    })
  })

  it('can preview actions without executing them', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          executeActions: false,
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '插入 3 行 4 列表格'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('确认执行操作')
    expect(document.body.querySelector('.sky-dialog__message').textContent).toContain('1. 插入 3 行 4 列表格')

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(tiptapState.latestChain.insertTable).not.toHaveBeenCalled()
  })

  it('rolls back editor content when action execution fails', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          baseUrl: 'https://api.example.com/ai-actions',
          apiKey: 'test-key',
        },
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    tiptapState.latestEditor.getHTML.mockReturnValue('<p>before</p>')
    tiptapState.latestChain.run
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)

    emitter.emit('AI-generated')
    await nextTick()
    await flushPromises()

    const input = document.body.querySelector('.sky-dialog__input')
    input.value = '插入 3 行 4 列表格'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(tiptapState.latestChain.insertTable).toHaveBeenCalledWith({
      rows: 3,
      cols: 4,
      withHeaderRow: true,
    })
    expect(tiptapState.latestEditor.commands.setContent).toHaveBeenCalledWith('<p>before</p>')
    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('AI 操作失败')
  })

  it('shows an execution summary when configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          showActionResult: true,
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '插入抖音视频：https://www.douyin.com/video/7633060374058167217'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('AI 操作完成')
    expect(document.body.querySelector('.sky-dialog__message').textContent).toContain('1. 插入抖音视频')
  })

  it('does not replace follow-up input dialogs with execution summaries', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        aiConfig: {
          mode: 'actions',
          showActionResult: true,
          baseUrl: 'https://api.example.com/ai-actions',
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
    input.value = '插入抖音视频'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.body.querySelector('.sky-dialog__button--primary').click()
    await flushPromises()

    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('插入抖音视频')
    expect(document.body.querySelector('.sky-dialog__input').getAttribute('placeholder')).toBe('https://www.douyin.com/video/7635170198135278902')
  })
})
