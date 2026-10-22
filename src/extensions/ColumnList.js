/**
 * Sky Tiptap - 多栏节点
 *
 * 参考 Notion 的 column_list / column 结构：columnList 内包含多个 column，
 * 每个 column 内可以放普通块。
 *
 * 使用 @tiptap/pm/model 定义节点，避免为这两个结构引入额外依赖。
 */

import { Node, mergeAttributes } from '@tiptap/core'

/** 单栏 */
export const Column = Node.create({
  name: 'column',

  group: 'column',

  content: 'block+',

  isolating: true,

  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0]
  },
})

/** 多栏容器 */
export const ColumnList = Node.create({
  name: 'columnList',

  group: 'block',

  content: 'column column+',

  defining: true,

  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="columnList"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columnList' }), 0]
  },
})

export default ColumnList
