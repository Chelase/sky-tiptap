/**
 * Sky Tiptap - 块级操作
 *
 * 提供块级移动、复制、选中能力，供块级快捷键使用。
 * 对应 Notion 的 ⌘⇧↑/↓（移动块）、⌘D（复制块）、Esc（选中块）。
 */

import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { getChildStart } from './block-controls'

/**
 * 找到当前选区所在的顶层块
 * @param {Object} editor Tiptap editor 实例
 * @returns {Object|null} { pos, end, node, index }
 */
export const findCurrentTopLevelBlock = (editor) => {
  const doc = editor?.state?.doc
  if (!doc || !doc.childCount) {
    return null
  }

  const { selection } = editor.state
  const $pos = doc.resolve(selection.from)

  let index
  let pos
  let node

  if ($pos.depth >= 1) {
    node = $pos.node(1)
    pos = $pos.before(1)
    index = doc.resolve(pos).index(0)
  } else {
    index = Math.min($pos.index(0), doc.childCount - 1)
    node = doc.child(index)
    pos = getChildStart(doc, index)
  }

  if (!node) {
    return null
  }

  return { pos, end: pos + node.nodeSize, node, index }
}

/**
 * 移动顶层块
 * @param {Object} editor Tiptap editor 实例
 * @param {'up'|'down'} direction 移动方向
 * @returns {boolean} 是否移动成功
 */
export const moveBlock = (editor, direction) => {
  if (!editor || (direction !== 'up' && direction !== 'down')) {
    return false
  }

  const info = findCurrentTopLevelBlock(editor)
  if (!info) {
    return false
  }

  const { state } = editor
  const { index, pos, node } = info
  const childCount = state.doc.childCount

  if (direction === 'up' && index <= 0) {
    return false
  }

  if (direction === 'down' && index >= childCount - 1) {
    return false
  }

  const tr = state.tr.delete(pos, pos + node.nodeSize)

  // 删除后目标块下标会前移
  const targetIndex = direction === 'up' ? index - 1 : index
  if (targetIndex < 0 || targetIndex >= tr.doc.childCount) {
    return false
  }

  const targetStart = getChildStart(tr.doc, targetIndex)
  const targetNode = tr.doc.child(targetIndex)
  // 上移插到目标块之前，下移插到目标块之后
  const insertPos = direction === 'up' ? targetStart : targetStart + targetNode.nodeSize

  tr.insert(insertPos, node)

  try {
    tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)))
  } catch (error) {
    // 原子块等场景无法定位文本光标时，保留原选区
  }

  editor.view.dispatch(tr)
  return true
}

/**
 * 复制当前顶层块
 * @param {Object} editor Tiptap editor 实例
 * @returns {boolean} 是否复制成功
 */
export const duplicateBlock = (editor) => {
  const info = findCurrentTopLevelBlock(editor)
  if (!info) {
    return false
  }

  const { state } = editor
  const { pos, node } = info
  const insertPos = pos + node.nodeSize

  const tr = state.tr.insert(insertPos, node.copy(node.content))

  try {
    tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)))
  } catch (error) {
    // 复制后无法定位文本光标时，保留原选区
  }

  editor.view.dispatch(tr)
  return true
}

/**
 * 选中当前顶层块
 * @param {Object} editor Tiptap editor 实例
 * @returns {boolean} 是否选中成功
 */
export const selectBlock = (editor) => {
  const info = findCurrentTopLevelBlock(editor)
  if (!info) {
    return false
  }

  try {
    const selection = NodeSelection.create(editor.state.doc, info.pos)
    editor.view.dispatch(editor.state.tr.setSelection(selection))
    return true
  } catch (error) {
    return false
  }
}
