/**
 * Sky Tiptap - 链接弹窗参数
 *
 * 悬浮菜单与块级快捷键共用同一份弹窗参数，避免两处维护。
 */

/**
 * 生成「设置链接」弹窗参数
 * @param {Object} editor Tiptap editor 实例
 * @returns {Object} 弹窗参数
 */
export const createLinkDialogPayload = (editor) => {
  const previousUrl = editor?.getAttributes?.('link')?.href || ''

  return {
    mode: 'input',
    title: '设置链接',
    description: '输入要绑定到当前选中文本的链接地址。清空内容可移除链接。',
    inputLabel: '链接地址',
    placeholder: 'https://example.com',
    defaultValue: previousUrl,
    confirmText: '应用',
    onConfirm: (url) => {
      if (url === '') {
        editor?.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
  }
}
