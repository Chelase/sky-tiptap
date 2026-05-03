// main.js
// Sky Tiptap 入口文件 - 导出所有公共 API

import { ref } from 'vue'
import SkyTiptapComponent from './components/SkyTiptap.vue'
import './styles/base.css'

// ===== 向后兼容导出 =====

// 导出一个全局的编辑器引用
export const editorRef = ref()

// 直接导出的 insertImage 函数
export const insertImage = (url) => {
  if (typeof window !== 'undefined' && window.skyTiptapEditor) {
    window.skyTiptapEditor.chain().focus().setImage({ src: url }).run()
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

export const insertImages = (urls) => {
  if (typeof window !== 'undefined' && window.skyTiptapEditor) {
    const imageUrls = Array.isArray(urls) ? urls : [urls]
    imageUrls.filter(Boolean).forEach((url) => {
      window.skyTiptapEditor.chain().focus().setImage({ src: url }).run()
    })
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

export const insertVideo = (url) => {
  if (typeof window !== 'undefined' && window.skyTiptapEditor) {
    window.skyTiptapEditor.chain().focus().setUploadedVideo({ src: url }).run()
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

export const insertVideos = (urls) => {
  if (typeof window !== 'undefined' && window.skyTiptapEditor) {
    const videoUrls = Array.isArray(urls) ? urls : [urls]
    videoUrls.filter(Boolean).forEach((url) => {
      window.skyTiptapEditor.chain().focus().setUploadedVideo({ src: url }).run()
    })
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
  }
}

// 获取编辑器内容
export const getContent = () => {
  if (typeof window !== 'undefined' && window.skyTiptapEditor) {
    return window.skyTiptapEditor.getHTML()
  } else {
    console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
    return ''
  }
}

// 默认导出组件（向后兼容）
export { SkyTiptapComponent as SkyTiptap }

// ===== 新架构导出 =====

// 导出组件
export { default as Toolbar } from './components/Toolbar/Toolbar.vue'
export { default as ToolbarButton } from './components/Toolbar/ToolbarButton.vue'
export { default as BubbleMenu } from './components/BubbleMenu/BubbleMenu.vue'
export { default as InsertMenuNew } from './components/Toolbar/Menu/InsertMenu.vue'
export { default as CodeBlock } from './components/NodeView/CodeBlock.vue'

// 导出图标
export { icons, getIcon, Icon } from './icons'

// 导出配置
export { TipTapPlugin, defaultToolbarConfig, defaultBubbleMenuConfig } from './config/default'

// 导出工具
export { emitter } from './utils/emitter'

// 导出扩展
export { CustomParagraph } from './extensions/CustomParagraph'
export { default as VideoEmbed } from './extensions/web-video'
export { default as Iframe } from './extensions/iframe'
