/**
 * Sky Tiptap - 编辑器实例注册表
 *
 * 解决多个编辑器实例共享 `window.skyTiptapEditor` 时互相覆盖的问题：
 * 注册表记录所有实例，并跟踪当前活跃（最近聚焦）的实例。
 */

const editors = new Set()
let activeEditor = null

/**
 * 注册编辑器实例
 * @param {Object} editor Tiptap editor 实例
 */
export const registerEditor = (editor) => {
  if (!editor) {
    return
  }

  editors.add(editor)
  if (!activeEditor) {
    activeEditor = editor
  }
}

/**
 * 注销编辑器实例
 * @param {Object} editor Tiptap editor 实例
 */
export const unregisterEditor = (editor) => {
  if (!editor) {
    return
  }

  editors.delete(editor)

  if (activeEditor === editor) {
    const list = [...editors]
    activeEditor = list[list.length - 1] || null
  }
}

/**
 * 标记当前活跃的编辑器
 * @param {Object} editor Tiptap editor 实例
 */
export const setActiveEditor = (editor) => {
  if (editor) {
    activeEditor = editor
  }
}

/**
 * 获取当前活跃的编辑器
 * @returns {Object|null}
 */
export const getActiveEditor = () => activeEditor

/**
 * 获取可用编辑器（优先活跃实例，其次最近注册的实例）
 * @returns {Object|null}
 */
export const getEditor = () => {
  if (activeEditor) {
    return activeEditor
  }

  const list = [...editors]
  return list[list.length - 1] || null
}

/**
 * 清空注册表（测试用）
 */
export const clearEditorRegistry = () => {
  editors.clear()
  activeEditor = null
}
