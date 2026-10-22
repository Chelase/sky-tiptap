/**
 * Sky Tiptap - 菜单配置
 *
 * 工具栏与悬浮菜单的条目编排，单独成文件是为了避免组件引入整个编辑器配置链。
 * 两者同时从 src/config/default.js 重新导出，保持既有导出路径不变。
 */

/**
 * 默认工具栏配置
 * groups 只声明展示哪些条目，条目行为见 src/config/toolbar-items.js
 */
export const defaultToolbarConfig = {
  groups: [
    {
      name: 'history',
      items: ['undo', 'redo']
    },
    {
      name: 'format',
      items: ['bold', 'italic', 'underline', 'strike']
    },
    {
      name: 'heading',
      items: ['heading1', 'heading2', 'heading3']
    },
    {
      name: 'list',
      items: ['bulletList', 'orderedList']
    },
    {
      name: 'insert',
      items: ['image', 'video', 'codeBlock', 'table', 'divider', 'link']
    },
    {
      name: 'ai',
      items: ['ai']
    }
  ]
}

/**
 * 默认悬浮菜单配置
 * groups 用于控制分组与分隔线，items 为扁平条目列表
 */
export const defaultBubbleMenuConfig = {
  groups: [
    {
      items: ['bold', 'italic', 'underline', 'strike']
    },
    {
      items: ['heading1', 'heading2', 'heading3']
    },
    {
      items: ['bulletList', 'orderedList']
    },
    {
      items: ['link']
    }
  ],
  items: [
    'bold',
    'italic',
    'underline',
    'strike',
    'heading1',
    'heading2',
    'heading3',
    'bulletList',
    'orderedList',
    'link'
  ]
}
