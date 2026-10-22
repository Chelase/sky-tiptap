/**
 * Sky Tiptap - 块级键盘快捷键
 *
 * 快捷键集合参考 Notion 的编辑器键位表（block level shortcuts），
 * 只覆盖块级能力，文本级快捷键仍由浏览器 / 扩展提供。
 */

import { duplicateBlock, moveBlock, selectBlock } from './block-actions'

/** 是否 macOS 平台 */
export const isApplePlatform = () => {
  if (typeof navigator === 'undefined') {
    return false
  }

  const platform = navigator.platform || navigator.userAgent || ''
  return /Mac|iPhone|iPad|iPod/i.test(platform)
}

/** 主修饰键：macOS 为 ⌘，其他平台为 Ctrl */
export const isModifierPressed = (event) => (isApplePlatform() ? event.metaKey : event.ctrlKey)

/** 快捷键标识表 */
export const BLOCK_SHORTCUTS = {
  openInsertMenu: 'mod+/',
  moveBlockUp: 'mod+shift+ArrowUp',
  moveBlockDown: 'mod+shift+ArrowDown',
  duplicateBlock: 'mod+d',
  selectBlock: 'Escape',
  toggleBold: 'mod+b',
  toggleItalic: 'mod+i',
  toggleUnderline: 'mod+u',
  toggleHighlight: 'mod+shift+h',
  openLink: 'mod+k',
}

/**
 * 创建块级快捷键处理器
 *
 * @param {Object} editor Tiptap editor 实例
 * @param {Object} [handlers] 额外处理器
 * @param {Function} [handlers.openInsertMenu] 打开块插入菜单
 * @param {Function} [handlers.openLink] 打开链接设置
 * @returns {Function} ProseMirror handleKeyDown
 */
export const createBlockKeyboardShortcuts = (editor, handlers = {}) => {
  return (view, event) => {
    if (!event) {
      return false
    }

    const mod = isModifierPressed(event)

    // 块插入菜单：⌘/ 或 Ctrl/
    if (mod && !event.shiftKey && !event.altKey && event.key === '/') {
      event.preventDefault()
      handlers.openInsertMenu?.()
      return true
    }

    // 链接：⌘K 或 Ctrl+K
    if (mod && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      handlers.openLink?.()
      return true
    }

    // 移动块：⌘⇧↑ / ⌘⇧↓
    if (mod && event.shiftKey && !event.altKey) {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        return moveBlock(editor, 'up')
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        return moveBlock(editor, 'down')
      }
    }

    // 复制块：⌘D / Ctrl+D
    if (mod && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      return duplicateBlock(editor)
    }

    // 文本格式：⌘B / ⌘I / ⌘U / ⌘⇧H
    if (mod && !event.altKey) {
      const key = event.key.toLowerCase()
      const chain = editor?.chain?.().focus()

      if (!event.shiftKey && key === 'b') {
        event.preventDefault()
        chain?.toggleBold().run()
        return true
      }

      if (!event.shiftKey && key === 'i') {
        event.preventDefault()
        chain?.toggleItalic().run()
        return true
      }

      if (!event.shiftKey && key === 'u') {
        event.preventDefault()
        chain?.toggleUnderline().run()
        return true
      }

      if (event.shiftKey && key === 'h') {
        event.preventDefault()
        chain?.toggleHighlight().run()
        return true
      }
    }

    // 选中当前块：Esc
    if (event.key === 'Escape' && !mod && !event.shiftKey && !event.altKey) {
      const selection = editor?.state?.selection
      const isNodeSelection = Boolean(selection && selection.constructor?.name === 'NodeSelection')

      if (!isNodeSelection) {
        // 优先交给外部处理（例如关闭 slash 菜单）
        if (handlers.onEscape?.() === true) {
          event.preventDefault()
          return true
        }

        event.preventDefault()
        return selectBlock(editor)
      }
    }

    return false
  }
}
