/**
 * Sky Tiptap - 统一块插入层
 *
 * 「+」按钮菜单、工具栏、「/」快捷键共用同一套插入逻辑，
 * 避免各组件重复实现插入分支。
 */

import { emitter } from './emitter'

/** 需要走外部流程（上传 / 弹窗 / 平台子菜单）的块类型 */
export const EXTERNAL_BLOCK_TYPES = ['image', 'video', 'embed', 'ai']

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
 * 根据类型创建块内容
 * @param {string} type 块类型
 * @returns {Object|null}
 */
export const createBlockContent = (type) => {
  switch (type) {
    case 'text':
      return createParagraph()
    case 'heading1':
      return createHeading(1)
    case 'heading2':
      return createHeading(2)
    case 'heading3':
      return createHeading(3)
    case 'quote':
      return createQuote()
    case 'divider':
      return createDivider()
    case 'bulletList':
      return createList('bulletList')
    case 'orderedList':
      return createList('orderedList')
    case 'codeBlock':
      return createCodeBlock()
    case 'table':
      return createTable()
    case 'column2':
      return createColumnList(2)
    case 'column3':
      return createColumnList(3)
    default:
      return null
  }
}

/**
 * 触发外部插入流程（图片上传、视频平台、网站嵌入、AI 生成）
 * @param {string} type 块类型
 * @returns {boolean} 是否已处理
 */
export const triggerExternalBlock = (type) => {
  switch (type) {
    case 'image':
      emitter.emit('trigger-add-image')
      return true
    case 'video':
      emitter.emit('show-video-menu')
      return true
    case 'embed':
      emitter.emit('trigger-add-website')
      return true
    case 'ai':
      emitter.emit('ai-generate')
      emitter.emit('AI-generated')
      return true
    default:
      return false
  }
}

/**
 * 插入块
 *
 * @param {Object} editor Tiptap editor 实例
 * @param {string} type 块类型，见 src/config/insert-menu.js
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
