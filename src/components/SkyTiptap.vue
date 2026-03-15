<!-- SkyTiptap.vue - 主编辑器组件 -->
<template>
  <div class="sky-tiptap-wrapper" :data-theme="theme">
    <!-- 工具栏 -->
    <Toolbar v-if="showToolbar && editor" :editor="editor" />
    
    <!-- 编辑器内容区域 -->
    <div class="sky-editor" @click="handleContainerClick">
      <editor-content :editor="editor" />
    </div>
    
    <!-- 悬浮菜单 -->
    <BubbleMenuWrapper v-if="editor" :editor="editor" />
    
    <!-- 插入菜单 -->
    <InsertMenu v-if="editor" :editor="editor" />
    
    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInputRef"
      type="file" 
      style="display: none" 
      accept="image/*"
      @change="handleFileChange"
    >
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/vue-3'
import { emitter } from '../utils/emitter'
import { TipTapPlugin } from '../config/default'
import Toolbar from './Toolbar/Toolbar.vue'
import BubbleMenuWrapper from './BubbleMenu/BubbleMenu.vue'
import InsertMenu from './Toolbar/Menu/InsertMenu.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'dark'].includes(value)
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '输入内容...'
  }
})

const emit = defineEmits(['update:modelValue', 'uploadPhoto'])

const fileInputRef = ref(null)

// 创建编辑器实例
const editor = useEditor({
  ...TipTapPlugin,
  content: props.modelValue,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue)
  }
})

// 处理容器点击
const handleContainerClick = () => {
  emitter.emit('hide-all-paragraph-buttons')
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('uploadPhoto', file)
  }
  // 重置 input
  event.target.value = ''
}

// 暴露方法给外部
onMounted(() => {
  // 注册全局编辑器引用（向后兼容）
  if (typeof window !== 'undefined') {
    window.skyTiptapEditor = editor.value
  }
  
  // 监听插入事件
  emitter.on('trigger-add-image', () => {
    fileInputRef.value?.click()
  })
  
  emitter.on('trigger-add-bilibili', () => {
    const url = window.prompt('输入 Bilibili 视频链接或 BV 号')
    if (url) {
      editor.value?.chain().focus().setBilibiliVideo({ src: url }).run()
    }
  })

  emitter.on('trigger-add-youtube', () => {
    const url = window.prompt('输入 YouTube 视频链接')
    if (url) {
      editor.value?.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  })
  
  emitter.on('trigger-add-tiktok', () => {
    const url = window.prompt('输入抖音视频链接')
    if (url) {
      editor.value?.chain().focus().setTiktokVideo({ src: url }).run()
    }
  })

  emitter.on('trigger-add-website', () => {
    const url = window.prompt('输入网站链接')
    if (url) {
      editor.value?.chain().focus().setIframe({ src: url }).run()
    }
  })
})

onBeforeUnmount(() => {
  emitter.off('trigger-add-image')
  emitter.off('trigger-add-bilibili')
  emitter.off('trigger-add-youtube')
  emitter.off('trigger-add-tiktok')
  emitter.off('trigger-add-website')
  if (typeof window !== 'undefined') {
    window.skyTiptapEditor = null
  }
})

// 导出方法（向后兼容）
defineExpose({
  insertImage: (url) => {
    editor.value?.chain().focus().setImage({ src: url }).run()
  },
  getContent: () => {
    return editor.value?.getHTML() || ''
  },
  setContent: (content) => {
    editor.value?.commands.setContent(content)
  }
})
</script>

<style>
@import '../styles/base.css';
</style>
