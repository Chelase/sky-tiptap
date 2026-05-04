import { renderMarkdown } from './ai'

const ACTION_TYPES = new Set([
  'insertMarkdown',
  'setHeading',
  'insertTable',
  'insertCodeBlock',
  'toggleBulletList',
  'toggleOrderedList',
  'setLink',
  'unsetLink',
  'insertDivider',
  'insertImage',
  'insertUploadedVideo',
  'insertBilibiliVideo',
  'insertYoutubeVideo',
  'insertDouyinVideo',
  'insertIframe',
  'requestImageUpload',
  'requestVideoUpload',
  'requestImageUrl',
  'requestUploadedVideoUrl',
  'requestBilibiliVideo',
  'requestYoutubeVideo',
  'requestDouyinVideo',
  'requestIframeUrl',
  'requestLink',
])

const MAX_TABLE_ROWS = 20
const MAX_TABLE_COLS = 10

const isPlainObject = (value) => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const createActionError = (message) => {
  return new Error(`AI 操作格式不正确：${message}`)
}

const parseJsonText = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    throw createActionError('未返回有效 JSON')
  }
}

const extractJsonText = (responseText) => {
  if (typeof responseText !== 'string' || !responseText.trim()) {
    throw createActionError('响应为空')
  }

  const text = responseText.trim()
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim()
  }

  return text
}

const clampInteger = (value, { min, max, name }) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw createActionError(`${name} 必须是 ${min}-${max} 之间的整数`)
  }

  return value
}

const normalizeString = (value, name, { required = false } = {}) => {
  if (value === undefined || value === null) {
    if (required) {
      throw createActionError(`${name} 不能为空`)
    }
    return ''
  }

  if (typeof value !== 'string') {
    throw createActionError(`${name} 必须是字符串`)
  }

  const normalized = value.trim()
  if (required && !normalized) {
    throw createActionError(`${name} 不能为空`)
  }

  return normalized
}

const normalizeHttpUrl = (value, name) => {
  const url = normalizeString(value, name, { required: true })

  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error()
    }
  } catch {
    throw createActionError(`${name} 必须是 http 或 https 地址`)
  }

  return url
}

const normalizeAction = (action, index) => {
  if (!isPlainObject(action)) {
    throw createActionError(`第 ${index + 1} 个 action 必须是对象`)
  }

  const { type } = action
  if (!ACTION_TYPES.has(type)) {
    throw createActionError(`暂不支持 action: ${type || 'unknown'}`)
  }

  const params = isPlainObject(action.params) ? action.params : {}

  if (type === 'insertMarkdown') {
    return {
      type,
      params: {
        markdown: normalizeString(params.markdown, 'markdown', { required: true }),
      },
    }
  }

  if (type === 'setHeading') {
    return {
      type,
      params: {
        level: clampInteger(params.level, { min: 1, max: 3, name: 'level' }),
        text: normalizeString(params.text, 'text', { required: true }),
      },
    }
  }

  if (type === 'insertTable') {
    return {
      type,
      params: {
        rows: clampInteger(params.rows, { min: 1, max: MAX_TABLE_ROWS, name: 'rows' }),
        cols: clampInteger(params.cols, { min: 1, max: MAX_TABLE_COLS, name: 'cols' }),
        withHeaderRow: params.withHeaderRow !== false,
      },
    }
  }

  if (type === 'insertCodeBlock') {
    return {
      type,
      params: {
        language: normalizeString(params.language, 'language'),
        code: normalizeString(params.code, 'code'),
      },
    }
  }

  if ([
    'toggleBulletList',
    'toggleOrderedList',
    'unsetLink',
    'insertDivider',
    'requestImageUpload',
    'requestVideoUpload',
    'requestImageUrl',
    'requestUploadedVideoUrl',
    'requestBilibiliVideo',
    'requestYoutubeVideo',
    'requestDouyinVideo',
    'requestIframeUrl',
    'requestLink',
  ].includes(type)) {
    return {
      type,
      params: {},
    }
  }

  if (type === 'setLink') {
    return {
      type,
      params: {
        href: normalizeHttpUrl(params.href, 'href'),
        text: normalizeString(params.text, 'text'),
      },
    }
  }

  if (type === 'insertImage') {
    return {
      type,
      params: {
        src: normalizeHttpUrl(params.src, 'src'),
        alt: normalizeString(params.alt, 'alt'),
      },
    }
  }

  if (type === 'insertUploadedVideo' || type === 'insertIframe') {
    return {
      type,
      params: {
        src: normalizeHttpUrl(params.src, 'src'),
      },
    }
  }

  return {
    type,
    params: {
      src: normalizeString(params.src, 'src', { required: true }),
    },
  }
}

export const parseAiActionResponse = (responseText) => {
  return normalizeAiActions(parseJsonText(extractJsonText(responseText)))
}

export const normalizeAiActions = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeAction)
  }

  if (!isPlainObject(payload)) {
    throw createActionError('JSON 根节点必须是对象')
  }

  if (payload.mode && payload.mode !== 'actions') {
    throw createActionError('mode 必须是 actions')
  }

  if (!Array.isArray(payload.actions)) {
    throw createActionError('actions 必须是数组')
  }

  return payload.actions.map(normalizeAction)
}

export const describeAiAction = (action) => {
  const normalizedAction = normalizeAction(action, 0)
  const { type, params } = normalizedAction

  if (type === 'insertMarkdown') {
    return '插入 Markdown 内容'
  }

  if (type === 'setHeading') {
    return `插入 H${params.level} 标题：${params.text}`
  }

  if (type === 'insertTable') {
    return `插入 ${params.rows} 行 ${params.cols} 列表格`
  }

  if (type === 'insertCodeBlock') {
    return params.language ? `插入 ${params.language} 代码块` : '插入代码块'
  }

  if (type === 'toggleBulletList') {
    return '切换无序列表'
  }

  if (type === 'toggleOrderedList') {
    return '切换有序列表'
  }

  if (type === 'setLink') {
    return params.text ? `插入链接：${params.text}` : '设置当前选区链接'
  }

  if (type === 'unsetLink') {
    return '移除当前链接'
  }

  if (type === 'insertDivider') {
    return '插入分割线'
  }

  if (type === 'insertImage') {
    return params.alt ? `插入图片：${params.alt}` : '插入图片'
  }

  if (type === 'insertUploadedVideo') {
    return '插入已上传视频'
  }

  if (type === 'insertBilibiliVideo') {
    return '插入 Bilibili 视频'
  }

  if (type === 'insertYoutubeVideo') {
    return '插入 YouTube 视频'
  }

  if (type === 'insertDouyinVideo') {
    return '插入抖音视频'
  }

  if (type === 'insertIframe') {
    return '嵌入网站'
  }

  if (type === 'requestImageUpload') {
    return '打开图片上传选择器'
  }

  if (type === 'requestVideoUpload') {
    return '打开视频上传选择器'
  }

  if (type === 'requestImageUrl') {
    return '请求输入图片 URL'
  }

  if (type === 'requestUploadedVideoUrl') {
    return '请求输入已上传视频 URL'
  }

  if (type === 'requestBilibiliVideo') {
    return '请求输入 Bilibili 视频地址'
  }

  if (type === 'requestYoutubeVideo') {
    return '请求输入 YouTube 视频地址'
  }

  if (type === 'requestDouyinVideo') {
    return '请求输入抖音视频地址'
  }

  if (type === 'requestIframeUrl') {
    return '请求输入嵌入网站地址'
  }

  if (type === 'requestLink') {
    return '请求输入链接地址'
  }

  return type
}

export const describeAiActions = (actions) => {
  return normalizeAiActions(actions).map((action) => describeAiAction(action))
}

export const executeAiAction = (editor, action, options = {}) => {
  if (!editor) {
    return {
      ok: false,
      action,
      message: '编辑器未初始化',
    }
  }

  let executed = false

  if (action.type === 'insertMarkdown') {
    executed = editor.chain().focus().insertContent(renderMarkdown(action.params.markdown)).run()
  } else if (action.type === 'setHeading') {
    executed = editor.chain().focus().insertContent({
      type: 'heading',
      attrs: {
        level: action.params.level,
      },
      content: [
        {
          type: 'text',
          text: action.params.text,
        },
      ],
    }).run()
  } else if (action.type === 'insertTable') {
    executed = editor.chain().focus().insertTable(action.params).run()
  } else if (action.type === 'insertCodeBlock') {
    executed = editor.chain().focus().insertContent({
      type: 'codeBlock',
      attrs: action.params.language ? { language: action.params.language } : {},
      content: action.params.code ? [
        {
          type: 'text',
          text: action.params.code,
        },
      ] : [],
    }).run()
  } else if (action.type === 'toggleBulletList') {
    executed = editor.chain().focus().toggleBulletList().run()
  } else if (action.type === 'toggleOrderedList') {
    executed = editor.chain().focus().toggleOrderedList().run()
  } else if (action.type === 'setLink') {
    const chain = editor.chain().focus()
    if (action.params.text) {
      executed = chain.insertContent({
        type: 'text',
        text: action.params.text,
        marks: [
          {
            type: 'link',
            attrs: {
              href: action.params.href,
            },
          },
        ],
      }).run()
    } else {
      executed = chain.extendMarkRange('link').setLink({ href: action.params.href }).run()
    }
  } else if (action.type === 'unsetLink') {
    executed = editor.chain().focus().extendMarkRange('link').unsetLink().run()
  } else if (action.type === 'insertDivider') {
    executed = editor.chain().focus().setHorizontalRule().run()
  } else if (action.type === 'insertImage') {
    const attrs = action.params.alt ? { src: action.params.src, alt: action.params.alt } : { src: action.params.src }
    executed = editor.chain().focus().setImage(attrs).run()
  } else if (action.type === 'insertUploadedVideo') {
    executed = editor.chain().focus().setUploadedVideo({ src: action.params.src }).run()
  } else if (action.type === 'insertBilibiliVideo') {
    executed = editor.chain().focus().setBilibiliVideo({ src: action.params.src }).run()
  } else if (action.type === 'insertYoutubeVideo') {
    executed = editor.chain().focus().setYoutubeVideo({ src: action.params.src }).run()
  } else if (action.type === 'insertDouyinVideo') {
    executed = editor.chain().focus().setDouyinVideo({ src: action.params.src }).run()
  } else if (action.type === 'insertIframe') {
    executed = editor.chain().focus().setIframe({ src: action.params.src }).run()
  } else if (action.type === 'requestImageUpload') {
    executed = typeof options.requestImageUpload === 'function'
    options.requestImageUpload?.()
  } else if (action.type === 'requestVideoUpload') {
    executed = typeof options.requestVideoUpload === 'function'
    options.requestVideoUpload?.()
  } else if (action.type === 'requestImageUrl') {
    executed = typeof options.requestImageUrl === 'function'
    options.requestImageUrl?.()
  } else if (action.type === 'requestUploadedVideoUrl') {
    executed = typeof options.requestUploadedVideoUrl === 'function'
    options.requestUploadedVideoUrl?.()
  } else if (action.type === 'requestBilibiliVideo') {
    executed = typeof options.requestBilibiliVideo === 'function'
    options.requestBilibiliVideo?.()
  } else if (action.type === 'requestYoutubeVideo') {
    executed = typeof options.requestYoutubeVideo === 'function'
    options.requestYoutubeVideo?.()
  } else if (action.type === 'requestDouyinVideo') {
    executed = typeof options.requestDouyinVideo === 'function'
    options.requestDouyinVideo?.()
  } else if (action.type === 'requestIframeUrl') {
    executed = typeof options.requestIframeUrl === 'function'
    options.requestIframeUrl?.()
  } else if (action.type === 'requestLink') {
    executed = typeof options.requestLink === 'function'
    options.requestLink?.()
  }

  return {
    ok: Boolean(executed),
    action,
    summary: describeAiAction(action),
    message: executed ? describeAiAction(action) : `${describeAiAction(action)}执行失败`,
  }
}

export const executeAiActions = (editor, actions, options = {}) => {
  const normalizedActions = normalizeAiActions(actions)
  const summary = describeAiActions(normalizedActions)
  const results = []

  for (const action of normalizedActions) {
    const result = executeAiAction(editor, action, options)
    results.push(result)

    if (!result.ok) {
      return {
        ok: false,
        results,
        message: result.message,
        summary,
      }
    }
  }

  return {
    ok: true,
    results,
    message: normalizedActions.length ? `已执行 ${normalizedActions.length} 个操作` : '没有可执行操作',
    summary,
  }
}
