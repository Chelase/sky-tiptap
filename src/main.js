// main.js
// Sky Tiptap 入口文件 - 导出所有公共 API

import { ref } from 'vue'
import SkyTiptapComponent from './components/SkyTiptap.vue'
import { getEditor } from './utils/editor-registry'
import './styles/base.css'

// ===== 向后兼容导出 =====

// 导出一个全局的编辑器引用
export const editorRef = ref()

/** 获取可操作的编辑器实例（优先当前活跃实例） */
const resolveEditor = () => {
  const editor = getEditor()
  if (editor) {
    return editor
  }

  return typeof window !== 'undefined' ? window.skyTiptapEditor : null
}

// 直接导出的 insertImage 函数
export const insertImage = (url) => {
  const editor = resolveEditor()

  if (editor) {
    editor.chain().focus().setImage({ src: url }).run()
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

export const insertImages = (urls) => {
  const editor = resolveEditor()

  if (editor) {
    const imageUrls = Array.isArray(urls) ? urls : [urls]
    imageUrls.filter(Boolean).forEach((url) => {
      editor.chain().focus().setImage({ src: url }).run()
    })
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

export const insertVideo = (url) => {
  const editor = resolveEditor()

  if (editor) {
    editor.chain().focus().setUploadedVideo({ src: url }).run()
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

export const insertVideos = (urls) => {
  const editor = resolveEditor()

  if (editor) {
    const videoUrls = Array.isArray(urls) ? urls : [urls]
    videoUrls.filter(Boolean).forEach((url) => {
      editor.chain().focus().setUploadedVideo({ src: url }).run()
    })
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

// 获取编辑器内容
export const getContent = () => {
  const editor = resolveEditor()

  if (editor) {
    return editor.getHTML()
  }

  console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  return ''
}

// 默认导出组件（向后兼容）
export { SkyTiptapComponent as SkyTiptap }

// ===== 新架构导出 =====

// 导出组件
export { default as Toolbar } from './components/Toolbar/Toolbar.vue'
export { default as ToolbarButton } from './components/Toolbar/ToolbarButton.vue'
export { default as BubbleMenu } from './components/BubbleMenu/BubbleMenu.vue'
export { default as InsertMenuNew } from './components/Toolbar/Menu/InsertMenu.vue'
export { default as BlockAddButton } from './components/BlockControls/BlockAddButton.vue'
export { default as CodeBlock } from './components/NodeView/CodeBlock.vue'

// 导出图标
export { icons, getIcon, Icon } from './icons'

// 导出配置
export { TipTapPlugin, defaultToolbarConfig, defaultBubbleMenuConfig } from './config/default'
export {
  defaultInsertMenuItems,
  INSERT_MENU_GROUPS,
  filterInsertMenuItems,
  groupInsertMenuItems,
} from './config/insert-menu'

// 导出工具
export { emitter } from './utils/emitter'
export { insertBlock, createBlockContent } from './utils/block-insert'
export { moveBlock, duplicateBlock, selectBlock } from './utils/block-actions'
export { getEditor, getActiveEditor, registerEditor, unregisterEditor } from './utils/editor-registry'

// 导出扩展
export { CustomParagraph } from './extensions/CustomParagraph'
export { default as VideoEmbed } from '@sky-tiptap/extension-video-embed'
export { default as Iframe } from '@sky-tiptap/extension-iframe'
export { default as AiLoading } from '@sky-tiptap/extension-ai-loading'
export { default as BeforeChange } from '@sky-tiptap/extension-before-change'
