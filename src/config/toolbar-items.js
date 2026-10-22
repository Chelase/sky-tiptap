/**
 * Sky Tiptap - 工具栏 / 悬浮菜单条目注册表
 *
 * 工具栏与悬浮菜单都从这里取条目定义，配置（defaultToolbarConfig /
 * defaultBubbleMenuConfig）只负责声明「显示哪些条目、按什么顺序分组」。
 */

import { emitter } from '../utils/emitter'
import { createLinkDialogPayload } from '../utils/link-dialog'

/**
 * 条目定义
 * icon: 图标名
 * label: 文字内容（优先于图标）
 * tooltip: 提示文案
 * isActive: 是否处于激活态
 * disabled: 是否禁用
 * run: 点击行为
 */
export const toolbarItemSpecs = {
  undo: {
    icon: 'undo',
    tooltip: '撤销',
    run: (editor) => editor?.chain().focus().undo().run(),
    disabled: (editor) => !editor?.can().undo(),
  },
  redo: {
    icon: 'redo',
    tooltip: '重做',
    run: (editor) => editor?.chain().focus().redo().run(),
    disabled: (editor) => !editor?.can().redo(),
  },
  bold: {
    icon: 'bold',
    tooltip: '加粗',
    isActive: (editor) => editor?.isActive('bold'),
    run: (editor) => editor?.chain().focus().toggleBold().run(),
  },
  italic: {
    icon: 'italic',
    tooltip: '斜体',
    isActive: (editor) => editor?.isActive('italic'),
    run: (editor) => editor?.chain().focus().toggleItalic().run(),
  },
  underline: {
    icon: 'underline',
    tooltip: '下划线',
    isActive: (editor) => editor?.isActive('underline'),
    run: (editor) => editor?.chain().focus().toggleUnderline().run(),
  },
  strike: {
    icon: 'strike',
    tooltip: '删除线',
    isActive: (editor) => editor?.isActive('strike'),
    run: (editor) => editor?.chain().focus().toggleStrike().run(),
  },
  heading1: {
    label: 'H1',
    tooltip: '一级标题',
    isActive: (editor) => editor?.isActive('heading', { level: 1 }),
    run: (editor) => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  heading2: {
    label: 'H2',
    tooltip: '二级标题',
    isActive: (editor) => editor?.isActive('heading', { level: 2 }),
    run: (editor) => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  heading3: {
    label: 'H3',
    tooltip: '三级标题',
    isActive: (editor) => editor?.isActive('heading', { level: 3 }),
    run: (editor) => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  bulletList: {
    icon: 'bulletList',
    tooltip: '无序列表',
    isActive: (editor) => editor?.isActive('bulletList'),
    run: (editor) => editor?.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    icon: 'orderedList',
    tooltip: '有序列表',
    isActive: (editor) => editor?.isActive('orderedList'),
    run: (editor) => editor?.chain().focus().toggleOrderedList().run(),
  },
  image: {
    icon: 'image',
    tooltip: '插入图片',
    run: () => emitter.emit('trigger-add-image'),
  },
  video: {
    icon: 'video',
    tooltip: '插入视频',
    run: () => emitter.emit('show-video-menu'),
  },
  codeBlock: {
    icon: 'code',
    tooltip: '代码块',
    isActive: (editor) => editor?.isActive('codeBlock'),
    run: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
  },
  table: {
    icon: 'table',
    tooltip: '表格',
    run: (editor) => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  divider: {
    icon: 'divider',
    tooltip: '分割线',
    run: (editor) => editor?.chain().focus().setHorizontalRule().run(),
  },
  link: {
    icon: 'link',
    tooltip: '链接',
    isActive: (editor) => editor?.isActive('link'),
    run: (editor) => emitter.emit('open-dialog', createLinkDialogPayload(editor)),
  },
  ai: {
    icon: 'ai',
    tooltip: 'AI 生成',
    // 同时触发新事件名与历史事件名，保持向后兼容
    run: () => {
      emitter.emit('ai-generate')
      emitter.emit('AI-generated')
    },
  },
}

/**
 * 取得条目定义
 * @param {string} key 条目 key
 * @returns {Object|null}
 */
export const getToolbarItemSpec = (key) => toolbarItemSpecs[key] || null
