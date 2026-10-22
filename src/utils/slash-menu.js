/**
 * Sky Tiptap - Slash 菜单
 *
 * 解析当前块在光标处输入的 `/` 命令，驱动块目录过滤。
 */

/** Slash 触发字符 */
export const SLASH_TRIGGER = '/'

/**
 * Slash 命令匹配：`/` 开头且不包含空白
 * @type {RegExp}
 */
export const SLASH_COMMAND_REGEX = /^\/([^\s/]*)$/

/**
 * 解析光标前文本是否为 slash 命令
 * @param {string} text 光标前的块文本
 * @returns {Object|null} { query } 或 null
 */
export const parseSlashCommand = (text) => {
  if (typeof text !== 'string') {
    return null
  }

  const match = SLASH_COMMAND_REGEX.exec(text)
  if (!match) {
    return null
  }

  return { query: match[1] || '' }
}

/**
 * 读取当前块在光标处的文本
 * @param {Object} editor Tiptap editor 实例
 * @returns {string}
 */
export const getTextBeforeCursor = (editor) => {
  const selection = editor?.state?.selection
  const $from = selection?.$from

  if (!$from || typeof $from.parent?.textBetween !== 'function') {
    return ''
  }

  return $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
}
