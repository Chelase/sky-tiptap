import { describe, expect, it, vi } from 'vitest'

import {
  describeAiActions,
  executeAiAction,
  executeAiActions,
  normalizeAiActions,
  parseAiActionResponse,
} from '../utils/ai-actions'

const createEditor = () => {
  const run = vi.fn(() => true)
  const chain = {
    focus: vi.fn(() => chain),
    extendMarkRange: vi.fn(() => chain),
    insertContent: vi.fn(() => chain),
    insertTable: vi.fn(() => chain),
    insertDivider: vi.fn(() => chain),
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
    run,
  }

  return {
    chain,
    editor: {
      chain: vi.fn(() => chain),
    },
  }
}

describe('AI editor actions', () => {
  it('parses pure JSON action responses', () => {
    const actions = parseAiActionResponse(JSON.stringify({
      mode: 'actions',
      actions: [
        {
          type: 'insertMarkdown',
          params: {
            markdown: '## 标题',
          },
        },
      ],
    }))

    expect(actions).toEqual([
      {
        type: 'insertMarkdown',
        params: {
          markdown: '## 标题',
        },
      },
    ])
  })

  it('extracts JSON from markdown code fences', () => {
    const actions = parseAiActionResponse([
      '```json',
      JSON.stringify({
        mode: 'actions',
        actions: [
          {
            type: 'insertTable',
            params: {
              rows: 2,
              cols: 3,
              withHeaderRow: false,
            },
          },
        ],
      }),
      '```',
    ].join('\n'))

    expect(actions).toEqual([
      {
        type: 'insertTable',
        params: {
          rows: 2,
          cols: 3,
          withHeaderRow: false,
        },
      },
    ])
  })

  it('throws on non JSON responses', () => {
    expect(() => parseAiActionResponse('请插入一个标题')).toThrow('未返回有效 JSON')
  })

  it('rejects unknown action types', () => {
    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'runJavaScript',
          params: {
            code: 'alert(1)',
          },
        },
      ],
    })).toThrow('暂不支持 action')
  })

  it('executes insertMarkdown by rendering markdown before insertContent', () => {
    const { editor, chain } = createEditor()

    const result = executeAiAction(editor, {
      type: 'insertMarkdown',
      params: {
        markdown: '## 标题\n\n正文',
      },
    })

    expect(result.ok).toBe(true)
    expect(chain.insertContent).toHaveBeenCalledWith('<h2>标题</h2>\n<p>正文</p>\n')
    expect(chain.run).toHaveBeenCalled()
  })

  it('normalizes setHeading and limits heading level to H1-H3', () => {
    expect(normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'setHeading',
          params: {
            level: 2,
            text: '项目计划',
          },
        },
      ],
    })).toEqual([
      {
        type: 'setHeading',
        params: {
          level: 2,
          text: '项目计划',
        },
      },
    ])

    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'setHeading',
          params: {
            level: 4,
            text: '超出范围',
          },
        },
      ],
    })).toThrow('level 必须是 1-3 之间的整数')
  })

  it('executes setHeading as a heading node with text content', () => {
    const { editor, chain } = createEditor()

    executeAiAction(editor, {
      type: 'setHeading',
      params: {
        level: 2,
        text: '项目计划',
      },
    })

    expect(chain.insertContent).toHaveBeenCalledWith({
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
  })

  it('limits insertTable rows and columns', () => {
    expect(normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'insertTable',
          params: {
            rows: 20,
            cols: 10,
          },
        },
      ],
    })[0].params).toEqual({
      rows: 20,
      cols: 10,
      withHeaderRow: true,
    })

    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'insertTable',
          params: {
            rows: 21,
            cols: 3,
          },
        },
      ],
    })).toThrow('rows 必须是 1-20 之间的整数')

    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'insertTable',
          params: {
            rows: 3,
            cols: 11,
          },
        },
      ],
    })).toThrow('cols 必须是 1-10 之间的整数')
  })

  it('executes insertTable with normalized parameters', () => {
    const { editor, chain } = createEditor()

    executeAiAction(editor, {
      type: 'insertTable',
      params: {
        rows: 3,
        cols: 4,
        withHeaderRow: true,
      },
    })

    expect(chain.insertTable).toHaveBeenCalledWith({
      rows: 3,
      cols: 4,
      withHeaderRow: true,
    })
  })

  it('executes insertCodeBlock as a codeBlock node', () => {
    const { editor, chain } = createEditor()

    executeAiAction(editor, {
      type: 'insertCodeBlock',
      params: {
        language: 'javascript',
        code: 'console.log("ok")',
      },
    })

    expect(chain.insertContent).toHaveBeenCalledWith({
      type: 'codeBlock',
      attrs: {
        language: 'javascript',
      },
      content: [
        {
          type: 'text',
          text: 'console.log("ok")',
        },
      ],
    })
  })

  it('executes multiple actions in order', () => {
    const { editor, chain } = createEditor()

    const result = executeAiActions(editor, [
      {
        type: 'insertMarkdown',
        params: {
          markdown: '说明',
        },
      },
      {
        type: 'insertTable',
        params: {
          rows: 2,
          cols: 2,
        },
      },
    ])

    expect(result.ok).toBe(true)
    expect(chain.insertContent.mock.invocationCallOrder[0]).toBeLessThan(chain.insertTable.mock.invocationCallOrder[0])
    expect(result.summary).toEqual([
      '插入 Markdown 内容',
      '插入 2 行 2 列表格',
    ])
  })

  it('describes normalized actions for previews and execution summaries', () => {
    expect(describeAiActions([
      {
        type: 'setHeading',
        params: {
          level: 2,
          text: '项目计划',
        },
      },
      {
        type: 'insertDouyinVideo',
        params: {
          src: 'https://www.douyin.com/video/7633060374058167217',
        },
      },
      {
        type: 'requestImageUpload',
      },
    ])).toEqual([
      '插入 H2 标题：项目计划',
      '插入抖音视频',
      '打开图片上传选择器',
    ])
  })

  it('does not execute any action when one action is invalid', () => {
    const { editor, chain } = createEditor()

    expect(() => executeAiActions(editor, [
      {
        type: 'insertMarkdown',
        params: {
          markdown: '说明',
        },
      },
      {
        type: 'insertTable',
        params: {
          rows: 100,
          cols: 2,
        },
      },
    ])).toThrow('rows 必须是 1-20 之间的整数')

    expect(chain.insertContent).not.toHaveBeenCalled()
    expect(chain.insertTable).not.toHaveBeenCalled()
  })

  it('executes list and divider actions', () => {
    const { editor, chain } = createEditor()

    const result = executeAiActions(editor, [
      {
        type: 'toggleBulletList',
      },
      {
        type: 'toggleOrderedList',
      },
      {
        type: 'insertDivider',
      },
    ])

    expect(result.ok).toBe(true)
    expect(chain.toggleBulletList).toHaveBeenCalled()
    expect(chain.toggleOrderedList).toHaveBeenCalled()
    expect(chain.setHorizontalRule).toHaveBeenCalled()
  })

  it('sets and unsets links with validated http urls', () => {
    const { editor, chain } = createEditor()

    executeAiActions(editor, [
      {
        type: 'setLink',
        params: {
          href: 'https://example.com',
          text: '示例链接',
        },
      },
      {
        type: 'unsetLink',
      },
    ])

    expect(chain.insertContent).toHaveBeenCalledWith({
      type: 'text',
      text: '示例链接',
      marks: [
        {
          type: 'link',
          attrs: {
            href: 'https://example.com',
          },
        },
      ],
    })
    expect(chain.unsetLink).toHaveBeenCalled()

    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'setLink',
          params: {
            href: 'javascript:alert(1)',
          },
        },
      ],
    })).toThrow('href 必须是 http 或 https 地址')
  })

  it('applies link mark to current selection when text is omitted', () => {
    const { editor, chain } = createEditor()

    executeAiAction(editor, {
      type: 'setLink',
      params: {
        href: 'https://example.com',
        text: '',
      },
    })

    expect(chain.extendMarkRange).toHaveBeenCalledWith('link')
    expect(chain.setLink).toHaveBeenCalledWith({
      href: 'https://example.com',
    })
  })

  it('executes media and embed actions', () => {
    const { editor, chain } = createEditor()

    const result = executeAiActions(editor, [
      {
        type: 'insertImage',
        params: {
          src: 'https://example.com/image.png',
          alt: '封面',
        },
      },
      {
        type: 'insertUploadedVideo',
        params: {
          src: 'https://example.com/video.mp4',
        },
      },
      {
        type: 'insertBilibiliVideo',
        params: {
          src: 'BV1xx411c7XW',
        },
      },
      {
        type: 'insertYoutubeVideo',
        params: {
          src: 'https://youtu.be/abcdefghijk',
        },
      },
      {
        type: 'insertDouyinVideo',
        params: {
          src: '7635170198135278902',
        },
      },
      {
        type: 'insertIframe',
        params: {
          src: 'https://example.com/page',
        },
      },
    ])

    expect(result.ok).toBe(true)
    expect(chain.setImage).toHaveBeenCalledWith({
      src: 'https://example.com/image.png',
      alt: '封面',
    })
    expect(chain.setUploadedVideo).toHaveBeenCalledWith({
      src: 'https://example.com/video.mp4',
    })
    expect(chain.setBilibiliVideo).toHaveBeenCalledWith({
      src: 'BV1xx411c7XW',
    })
    expect(chain.setYoutubeVideo).toHaveBeenCalledWith({
      src: 'https://youtu.be/abcdefghijk',
    })
    expect(chain.setDouyinVideo).toHaveBeenCalledWith({
      src: '7635170198135278902',
    })
    expect(chain.setIframe).toHaveBeenCalledWith({
      src: 'https://example.com/page',
    })
  })

  it('rejects unsafe media and iframe urls', () => {
    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'insertImage',
          params: {
            src: 'data:image/svg+xml,<svg></svg>',
          },
        },
      ],
    })).toThrow('src 必须是 http 或 https 地址')

    expect(() => normalizeAiActions({
      mode: 'actions',
      actions: [
        {
          type: 'insertIframe',
          params: {
            src: 'ftp://example.com/page',
          },
        },
      ],
    })).toThrow('src 必须是 http 或 https 地址')
  })

  it('triggers controlled local upload requests through callbacks', () => {
    const { editor } = createEditor()
    const requestImageUpload = vi.fn()
    const requestVideoUpload = vi.fn()

    const result = executeAiActions(editor, [
      {
        type: 'requestImageUpload',
      },
      {
        type: 'requestVideoUpload',
      },
    ], {
      requestImageUpload,
      requestVideoUpload,
    })

    expect(result.ok).toBe(true)
    expect(requestImageUpload).toHaveBeenCalledOnce()
    expect(requestVideoUpload).toHaveBeenCalledOnce()
  })

  it('fails local upload requests when no callback is provided', () => {
    const { editor } = createEditor()

    const result = executeAiActions(editor, [
      {
        type: 'requestImageUpload',
      },
    ])

    expect(result.ok).toBe(false)
    expect(result.message).toBe('打开图片上传选择器执行失败')
    expect(result.summary).toEqual(['打开图片上传选择器'])
  })
})
