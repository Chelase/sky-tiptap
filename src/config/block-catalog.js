/**
 * Sky Tiptap - 块目录
 *
 * 唯一拥有「有哪些块、每种块怎么创建、外部流程怎么触发」的模块。
 *
 * 菜单（+ / 「/」）、工具栏、AI actions 都只是这里的投影：
 * - kind = 'node'：直接构造节点 JSON，走 insertContentAt / insertContent
 * - kind = 'request'：交给外部流程（上传、平台弹窗、AI 生成），只负责发事件
 *
 * 新增一种块 = 在这里加一条，不要再去调用方补分支。
 */

import { emitter } from '../utils/emitter'

/** 创建空段落 */
export const createParagraph = () => ({ type: 'paragraph', content: [] })

/** 创建标题 */
export const createHeading = (level = 1) => ({
  type: 'heading',
  attrs: { level },
  content: [],
})

/** 创建列表 */
export const createList = (type = 'bulletList') => ({
  type,
  content: [
    {
      type: 'listItem',
      content: [createParagraph()],
    },
  ],
})

/** 创建引用 */
export const createQuote = () => ({
  type: 'blockquote',
  content: [createParagraph()],
})

/** 创建分割线 */
export const createDivider = () => ({ type: 'horizontalRule' })

/** 创建代码块 */
export const createCodeBlock = () => ({ type: 'codeBlock', content: [] })

/** 创建表格 */
export const createTable = (rows = 3, cols = 3) => ({
  type: 'table',
  content: Array.from({ length: rows }).map((_, rowIndex) => ({
    type: 'tableRow',
    content: Array.from({ length: cols }).map((__, colIndex) => ({
      type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
      content: [createParagraph()],
    })),
  })),
})

/** 创建多栏 */
export const createColumnList = (columns = 2) => ({
  type: 'columnList',
  content: Array.from({ length: Math.min(Math.max(columns, 2), 5) }).map(() => ({
    type: 'column',
    content: [createParagraph()],
  })),
})

/**
 * 外部请求处理器
 *
 * key 是块目录里的 `request` 字段，不是块类型；这样「视频」这类
 * 需要二级菜单的块可以把请求语义（video）和块类型（video）分开。
 */
const BLOCK_REQUESTS = {
  image: () => emitter.emit('trigger-add-image'),
  video: () => emitter.emit('show-video-menu'),
  website: () => emitter.emit('trigger-add-website'),
  ai: () => {
    emitter.emit('ai-generate')
    // 历史事件名，保持向后兼容
    emitter.emit('AI-generated')
  },
}

/**
 * 块目录
 *
 * 顺序即菜单默认顺序（按分组展示时以 INSERT_MENU_GROUPS 为准）。
 */
export const blockCatalog = {
  text: {
    kind: 'node',
    label: '文本',
    icon: 'text',
    group: 'basic',
    keywords: ['text', '正文', '段落', 'plain'],
    create: createParagraph,
  },
  heading1: {
    kind: 'node',
    label: '一级标题',
    icon: 'heading1',
    group: 'basic',
    keywords: ['h1', 'heading1', '标题', 'title'],
    create: () => createHeading(1),
  },
  heading2: {
    kind: 'node',
    label: '二级标题',
    icon: 'heading2',
    group: 'basic',
    keywords: ['h2', 'heading2', '标题', 'subtitle'],
    create: () => createHeading(2),
  },
  heading3: {
    kind: 'node',
    label: '三级标题',
    icon: 'heading3',
    group: 'basic',
    keywords: ['h3', 'heading3', '标题'],
    create: () => createHeading(3),
  },
  quote: {
    kind: 'node',
    label: '引用',
    icon: 'quote',
    group: 'basic',
    keywords: ['quote', '引用', 'blockquote'],
    create: createQuote,
  },
  divider: {
    kind: 'node',
    label: '分割线',
    icon: 'divider',
    group: 'basic',
    keywords: ['divider', 'hr', '分割线', 'line'],
    create: createDivider,
  },
  bulletList: {
    kind: 'node',
    label: '无序列表',
    icon: 'bulletList',
    group: 'list',
    keywords: ['bullet', '无序', '列表', 'list'],
    create: () => createList('bulletList'),
  },
  orderedList: {
    kind: 'node',
    label: '有序列表',
    icon: 'orderedList',
    group: 'list',
    keywords: ['ordered', '有序', '列表', 'number'],
    create: () => createList('orderedList'),
  },
  image: {
    kind: 'request',
    label: '图片',
    icon: 'image',
    group: 'media',
    keywords: ['image', '图片', 'photo'],
    request: 'image',
  },
  video: {
    kind: 'request',
    label: '视频',
    icon: 'video',
    group: 'media',
    keywords: ['video', '视频', 'movie'],
    request: 'video',
  },
  embed: {
    kind: 'request',
    label: '嵌入网站',
    icon: 'website',
    group: 'media',
    keywords: ['embed', 'website', '网站', '嵌入', 'iframe'],
    request: 'website',
  },
  codeBlock: {
    kind: 'node',
    label: '代码块',
    icon: 'code',
    group: 'advanced',
    keywords: ['code', '代码', 'snippet'],
    create: createCodeBlock,
  },
  table: {
    kind: 'node',
    label: '表格',
    icon: 'table',
    group: 'advanced',
    keywords: ['table', '表格', 'grid'],
    create: () => createTable(3, 3),
  },
  column2: {
    kind: 'node',
    label: '两列',
    icon: 'columns',
    group: 'advanced',
    keywords: ['column', 'columns', '两列', '分栏', '布局'],
    create: () => createColumnList(2),
  },
  column3: {
    kind: 'node',
    label: '三列',
    icon: 'columns',
    group: 'advanced',
    keywords: ['column', 'columns', '三列', '分栏', '布局'],
    create: () => createColumnList(3),
  },
  ai: {
    kind: 'request',
    label: 'AI 生成',
    icon: 'ai',
    group: 'advanced',
    keywords: ['ai', '智能', '生成', 'gpt'],
    request: 'ai',
  },
}

/** 需要走外部流程的块类型 */
export const EXTERNAL_BLOCK_TYPES = Object.keys(blockCatalog).filter(
  (type) => blockCatalog[type].kind === 'request',
)

/**
 * 按类型取目录条目
 * @param {string} type 块类型
 * @returns {Object|null}
 */
export const getBlockEntry = (type) => (type && blockCatalog[type]) || null

/**
 * 列出目录条目（带上 type）
 * @param {Object} [options]
 * @param {string} [options.group] 只取某个分组
 * @returns {Array}
 */
export const listBlockEntries = (options = {}) => {
  const entries = Object.entries(blockCatalog).map(([type, entry]) => ({ type, ...entry }))

  if (!options.group) {
    return entries
  }

  return entries.filter((entry) => entry.group === options.group)
}

/**
 * 根据类型创建块内容（仅 kind = 'node'）
 * @param {string} type 块类型
 * @returns {Object|null}
 */
export const createBlockContent = (type) => {
  const entry = getBlockEntry(type)

  if (!entry || entry.kind !== 'node') {
    return null
  }

  return entry.create()
}

/**
 * 触发外部插入流程
 * @param {string} type 块类型
 * @returns {boolean} 是否已处理
 */
export const triggerExternalBlock = (type) => {
  const entry = getBlockEntry(type)

  if (!entry || entry.kind !== 'request') {
    return false
  }

  const handler = BLOCK_REQUESTS[entry.request]
  if (!handler) {
    return false
  }

  handler()
  return true
}

/**
 * 插入块
 *
 * 这是唯一的插入路径：菜单、工具栏、快捷键都从这里进入。
 *
 * @param {Object} editor Tiptap editor 实例
 * @param {string} type 块类型
 * @param {Object} [options]
 * @param {number} [options.insertAt] 插入位置（文档位置），缺省插入到当前选区
 * @returns {boolean} 是否插入成功
 */
export const insertBlock = (editor, type, options = {}) => {
  if (!editor || !type) {
    return false
  }

  if (EXTERNAL_BLOCK_TYPES.includes(type)) {
    return triggerExternalBlock(type)
  }

  const content = createBlockContent(type)
  if (!content) {
    return false
  }

  const chain = editor.chain().focus()
  const insertAt = options.insertAt

  if (typeof insertAt === 'number' && Number.isFinite(insertAt)) {
    chain.insertContentAt(insertAt, content)
  } else {
    chain.insertContent(content)
  }

  return chain.run()
}
