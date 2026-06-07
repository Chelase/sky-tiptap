import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import SkyTiptap from '../components/SkyTiptap.vue'
import { emitter } from '../utils/emitter'

const tiptapState = vi.hoisted(() => ({
  latestChain: null,
  latestEditor: null,
  latestOptions: null,
  editors: [],
  dragHandleProps: [],
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
    props: ['editor', 'class', 'tippyOptions', 'onNodeChange'],
    mounted() {
      tiptapState.dragHandleProps.push(this.$props)
    },
    render() {
      return h('div', { class: this.class || 'tiptap-drag-handle' }, this.$slots.default?.())
    }
  }
}))

const parseTopLevelNodes = (content = '') => {
  const trimmed = String(content).trim()
  if (!trimmed) return []
  const parsed = new DOMParser().parseFromString(trimmed, 'text/html')
  return Array.from(parsed.body.children).map((element) => {
    if (element.tagName === 'IMG') {
      return {
        type: { name: 'image' },
        isBlock: true,
        attrs: {
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt'),
        },
      }
    }

    if (element.tagName === 'TABLE') {
      return {
        type: { name: 'table' },
        isBlock: true,
        attrs: {
          rows: element.querySelectorAll('tr').length,
          cells: element.querySelectorAll('td, th').length,
        },
      }
    }

    if (element.matches('[data-video-embed]')) {
      return {
        type: { name: 'videoEmbed' },
        isBlock: true,
        attrs: {
          src: element.getAttribute('data-src'),
          type: element.getAttribute('data-type') || 'iframe',
        },
      }
    }

    if (element.tagName === 'IFRAME') {
      return {
        type: { name: 'iframe' },
        isBlock: true,
        attrs: {
          src: element.getAttribute('src'),
        },
      }
    }

    return {
      type: { name: element.tagName === 'H1' ? 'heading' : 'paragraph' },
      isBlock: true,
      attrs: {},
    }
  })
}

const getBeforeChangeExtension = () => {
  return tiptapState.latestOptions.extensions.find(extension => extension.name === 'beforeChange')
}

// Mock Tiptap Vue3
vi.mock('@tiptap/vue-3', async () => {
  const actual = await vi.importActual('@tiptap/vue-3')
  return {
    ...actual,
    useEditor: (options) => {
      tiptapState.latestOptions = options
      let topLevelNodes = parseTopLevelNodes(options.content)
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
            get childCount() {
              return topLevelNodes.length
            },
            forEach: vi.fn((callback) => {
              topLevelNodes.forEach((node, index) => callback(node, index, index))
            }),
            descendants: vi.fn((callback) => {
              topLevelNodes.forEach((node, index) => callback(node, index))
            }),
          }
        },
        __setTopLevelNodes(nodes) {
          topLevelNodes = nodes
        },
        isFocused: false,
        view: {
          dom: document.createElement('div')
        },
        element: document.createElement('div'),
        options: {}
      }
      tiptapState.latestEditor = editor
      tiptapState.editors.push(editor)
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
    tiptapState.latestChain = null
    tiptapState.latestEditor = null
    tiptapState.latestOptions = null
    tiptapState.editors = []
    tiptapState.dragHandleProps = []
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

    expect(wrapper.find('.sky-drag-handle').exists()).toBe(false)
  })

  it('renders drag handle for multiple top-level blocks', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p><p>World</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(wrapper.find('.sky-drag-handle').exists()).toBe(true)
    expect(wrapper.find('.sky-drag-handle-wrapper').exists()).toBe(true)
  })

  it('passes scoped drag handle options to the official Vue drag handle', async () => {
    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p><p>World</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(tiptapState.dragHandleProps).toHaveLength(1)
    expect(tiptapState.dragHandleProps[0].editor.value).toBe(tiptapState.latestEditor)
    expect(tiptapState.dragHandleProps[0].class).toBe('sky-drag-handle-wrapper')
    expect(tiptapState.dragHandleProps[0].tippyOptions).toEqual(expect.objectContaining({
      placement: 'left-start',
      offset: [3, 36],
      zIndex: 110,
    }))
    expect(typeof tiptapState.dragHandleProps[0].onNodeChange).toBe('function')
  })

  it('keeps drag handle scoped per editor instance', async () => {
    const first = mount(SkyTiptap, {
      props: {
        modelValue: '<p>First</p><p>Editor</p>'
      },
      attachTo: document.getElementById('app')
    })
    const second = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Second</p><p>Editor</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(first.find('.sky-drag-handle').exists()).toBe(true)
    expect(second.find('.sky-drag-handle').exists()).toBe(true)
    expect(tiptapState.dragHandleProps).toHaveLength(2)
    expect(tiptapState.dragHandleProps[0].editor.value).toBe(tiptapState.editors[0])
    expect(tiptapState.dragHandleProps[1].editor.value).toBe(tiptapState.editors[1])
    expect(tiptapState.dragHandleProps[0].editor.value).not.toBe(tiptapState.dragHandleProps[1].editor.value)
  })

  it('keeps drag handle available for image, video, iframe and table blocks', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: [
          '<p>Intro</p>',
          '<img src="https://example.com/photo.png" alt="Photo">',
          '<div data-video-embed data-src="https://example.com/video.mp4" data-type="video"></div>',
          '<iframe src="https://example.com/embed"></iframe>',
          '<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>',
        ].join(''),
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    expect(wrapper.find('.sky-drag-handle').exists()).toBe(true)
    expect(tiptapState.latestEditor.state.doc.childCount).toBe(5)
    const nodes = []
    tiptapState.latestEditor.state.doc.forEach((node) => nodes.push(node))
    expect(nodes.map(node => node.type.name)).toEqual([
      'paragraph',
      'image',
      'videoEmbed',
      'iframe',
      'table',
    ])
    expect(nodes[1].attrs).toEqual(expect.objectContaining({
      src: 'https://example.com/photo.png',
      alt: 'Photo',
    }))
    expect(nodes[2].attrs).toEqual(expect.objectContaining({
      src: 'https://example.com/video.mp4',
      type: 'video',
    }))
    expect(nodes[3].attrs).toEqual(expect.objectContaining({
      src: 'https://example.com/embed',
    }))
    expect(nodes[4].attrs).toEqual(expect.objectContaining({
      rows: 1,
      cells: 2,
    }))
  })

  it('hides drag handle for non-draggable active nodes', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p><p>World</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    tiptapState.dragHandleProps[0].onNodeChange({
      editor: tiptapState.latestEditor,
      node: {
        type: { name: 'aiLoading' },
        isBlock: true,
      },
      pos: 1,
    })
    await nextTick()

    expect(wrapper.find('.sky-drag-handle-wrapper--hidden').exists()).toBe(true)
  })

  it('refreshes drag handle availability when external content changes', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p><p>World</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()
    expect(wrapper.find('.sky-drag-handle').exists()).toBe(true)

    tiptapState.latestEditor.getHTML.mockReturnValue('<p>Hello</p><p>World</p>')
    tiptapState.latestEditor.__setTopLevelNodes(parseTopLevelNodes('<p>Hello</p>'))
    await wrapper.setProps({
      modelValue: '<p>Hello</p>',
    })
    await nextTick()

    expect(wrapper.find('.sky-drag-handle').exists()).toBe(false)
  })

  it('emits linkClick when editor links are clicked', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p><a href="https://example.com/docs">Docs</a></p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const link = document.createElement('a')
    link.setAttribute('href', 'https://example.com/docs')
    const label = document.createElement('span')
    link.appendChild(label)

    const event = {
      target: label,
      ctrlKey: false,
      metaKey: false,
      defaultPrevented: false,
      preventDefault: vi.fn(),
    }

    const handled = tiptapState.latestOptions.editorProps.handleClick(tiptapState.latestEditor.view, 12, event)

    expect(handled).toBe(false)
    expect(wrapper.emitted('linkClick')).toHaveLength(1)
    expect(wrapper.emitted('linkClick')[0][0]).toEqual(expect.objectContaining({
      event,
      target: link,
      href: 'https://example.com/docs',
      pos: 12,
      ctrlKey: false,
      metaKey: false,
    }))
    expect(typeof wrapper.emitted('linkClick')[0][0].preventDefault).toBe('function')
  })

  it('lets linkClick prevent the default link click behavior', async () => {
    const handleLinkClick = vi.fn((payload) => {
      payload.preventDefault()
    })
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)

    mount(SkyTiptap, {
      props: {
        modelValue: '<p><a href="https://example.com/docs">Docs</a></p>',
        onLinkClick: handleLinkClick,
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const link = document.createElement('a')
    link.setAttribute('href', 'https://example.com/docs')
    const label = document.createElement('span')
    link.appendChild(label)
    const event = {
      target: label,
      ctrlKey: true,
      metaKey: false,
      defaultPrevented: false,
      preventDefault: vi.fn(),
    }

    const handled = tiptapState.latestOptions.editorProps.handleClick(tiptapState.latestEditor.view, 8, event)

    expect(handled).toBe(true)
    expect(handleLinkClick).toHaveBeenCalledWith(expect.objectContaining({
      href: 'https://example.com/docs',
      ctrlKey: true,
    }))
    expect(event.preventDefault).toHaveBeenCalled()
    expect(openMock).not.toHaveBeenCalled()
  })

  it('keeps Ctrl or Meta click opening links when linkClick is not prevented', async () => {
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p><a href="https://example.com/docs">Docs</a></p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const link = document.createElement('a')
    link.setAttribute('href', 'https://example.com/docs')
    const label = document.createElement('span')
    link.appendChild(label)
    const event = {
      target: label,
      ctrlKey: true,
      metaKey: false,
      defaultPrevented: false,
      preventDefault: vi.fn(),
    }

    const handled = tiptapState.latestOptions.editorProps.handleClick(tiptapState.latestEditor.view, 8, event)

    expect(handled).toBe(true)
    expect(wrapper.emitted('linkClick')).toHaveLength(1)
    expect(openMock).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer')
  })

  it('emits beforeChange through the configured transaction filter extension', async () => {
    const wrapper = mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>'
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const beforeChange = getBeforeChangeExtension()
    const preventDefault = vi.fn()
    const payload = {
      transaction: { docChanged: true },
      state: { doc: {} },
      editor: tiptapState.latestEditor,
      currentHTML: '<p>Hello</p>',
      nextHTML: '<p>Hello world</p>',
      preventDefault,
    }

    const prevented = beforeChange.options.onBeforeChange(payload)

    expect(prevented).toBe(false)
    expect(wrapper.emitted('beforeChange')).toHaveLength(1)
    expect(wrapper.emitted('beforeChange')[0][0]).toEqual(expect.objectContaining({
      transaction: payload.transaction,
      state: payload.state,
      editor: tiptapState.latestEditor,
      currentHTML: '<p>Hello</p>',
      nextHTML: '<p>Hello world</p>',
    }))
  })

  it('lets beforeChange prevent document changes', async () => {
    const handleBeforeChange = vi.fn((payload) => {
      payload.preventDefault()
    })
    mount(SkyTiptap, {
      props: {
        modelValue: '<p>Hello</p>',
        onBeforeChange: handleBeforeChange,
      },
      attachTo: document.getElementById('app')
    })
    await nextTick()

    const beforeChange = getBeforeChangeExtension()
    const preventDefault = vi.fn()
    const payload = {
      transaction: { docChanged: true },
      state: { doc: {} },
      editor: tiptapState.latestEditor,
      currentHTML: '<p>Hello</p>',
      nextHTML: '<p>Blocked</p>',
      preventDefault,
    }

    const prevented = beforeChange.options.onBeforeChange(payload)

    expect(prevented).toBe(true)
    expect(handleBeforeChange).toHaveBeenCalledWith(expect.objectContaining({
      currentHTML: '<p>Hello</p>',
      nextHTML: '<p>Blocked</p>',
    }))
    expect(preventDefault).toHaveBeenCalled()
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
