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

    <!-- 统一弹窗 -->
    <SkyDialog />

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      accept="image/*"
      multiple
      @change="handleFileChange"
    >

    <input
      ref="videoInputRef"
      type="file"
      style="display: none"
      accept="video/*"
      multiple
      @change="handleVideoFileChange"
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
import SkyDialog from './Dialog/SkyDialog.vue'
import { requestAiContent } from '../utils/ai'

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
    default: false
  },
  placeholder: {
    type: String,
    default: '输入内容...'
  },
  aiConfig: {
    type: Object,
    default: () => ({
      baseUrl: '',
      apiKey: '',
    })
  }
})

const emit = defineEmits(['update:modelValue', 'uploadPhoto', 'uploadVideo'])

const fileInputRef = ref(null)
const videoInputRef = ref(null)

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
  const files = Array.from(event.target.files || [])
  if (files.length > 0) {
    emit('uploadPhoto', files)
  }
  // 重置 input
  event.target.value = ''
}

const handleVideoFileChange = (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length > 0) {
    emit('uploadVideo', files)
  }
  event.target.value = ''
}

// 全局点击处理函数
const handleGlobalClick = () => {
  emitter.emit('hide-all-paragraph-buttons')
}

const showMessageDialog = (title, message) => {
  emitter.emit('open-dialog', {
    mode: 'message',
    title,
    message,
    confirmText: '知道了',
    cancelText: '关闭',
  })
}

const showVideoUrlError = (message) => {
  showMessageDialog('无法插入视频', message)
}

const handleTriggerAddImage = () => {
  fileInputRef.value?.click()
}

const handleTriggerUploadVideo = () => {
  videoInputRef.value?.click()
}

const handleTriggerAddBilibili = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '插入 Bilibili 视频',
    description: '粘贴 Bilibili 视频链接，或直接输入 BV 号。',
    inputLabel: '视频链接或 BV 号',
    placeholder: 'https://www.bilibili.com/video/BV...',
    confirmText: '插入',
    validate: (value) => value ? '' : '请输入视频链接或 BV 号',
    onConfirm: (url) => {
      const inserted = editor.value?.chain().focus().setBilibiliVideo({ src: url }).run()
      if (!inserted) {
        showVideoUrlError('未匹配到 Bilibili 视频 BV 号，请输入包含 BV 号的视频链接或 BV 号')
      }
    },
  })
}

const handleTriggerAddYoutube = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '插入 YouTube 视频',
    description: '粘贴 YouTube 视频链接，系统会自动提取视频 ID。',
    inputLabel: '视频链接',
    placeholder: 'https://www.youtube.com/watch?v=...',
    confirmText: '插入',
    validate: (value) => value ? '' : '请输入 YouTube 视频链接',
    onConfirm: (url) => {
      const inserted = editor.value?.chain().focus().setYoutubeVideo({ src: url }).run()
      if (!inserted) {
        showVideoUrlError('未匹配到 YouTube 视频 ID，请输入有效的 YouTube 视频链接')
      }
    },
  })
}

const handleTriggerAddTikTok = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '插入抖音视频',
    description: '粘贴抖音视频链接，/video/ 后面的数字会作为视频 ID。',
    inputLabel: '视频链接',
    placeholder: 'https://www.douyin.com/video/7635170198135278902',
    defaultValue: 'https://www.douyin.com/video/7635170198135278902',
    confirmText: '插入',
    validate: (value) => value ? '' : '请输入抖音视频链接',
    onConfirm: (url) => {
      const inserted = editor.value?.chain().focus().setDouyinVideo({ src: url }).run()
      if (!inserted) {
        showVideoUrlError('未匹配到抖音视频 ID，请输入类似 https://www.douyin.com/video/*********** 的视频链接')
      }
    },
  })
}

const handleTriggerAddWebsite = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '嵌入网站',
    description: '输入要嵌入到编辑器中的网页地址。',
    inputLabel: '网站链接',
    placeholder: 'https://example.com',
    confirmText: '嵌入',
    validate: (value) => value ? '' : '请输入网站链接',
    onConfirm: (url) => {
      editor.value?.chain().focus().setIframe({ src: url }).run()
    },
  })
}

const insertGeneratedContent = (content) => {
  editor.value?.chain().focus().insertContent(content).run()
}

const createAiLoadingId = () => `sky-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`

const findAiLoadingRange = (loadingId) => {
  const activeEditor = editor.value
  if (!activeEditor?.state?.doc || !loadingId) {
    return null
  }

  let foundRange = null
  activeEditor.state.doc.descendants((node, pos) => {
    if (node.type?.name === 'aiLoading' && node.attrs?.id === loadingId) {
      foundRange = {
        from: pos,
        to: pos + node.nodeSize,
      }
      return false
    }

    return true
  })

  return foundRange
}

const insertAiLoading = (range) => {
  const activeEditor = editor.value
  if (!activeEditor) {
    return null
  }

  const loadingId = createAiLoadingId()
  activeEditor.chain().focus().insertContentAt({
    from: range.from,
    to: range.to,
  }, {
    type: 'aiLoading',
    attrs: {
      id: loadingId,
    },
  }).run()

  const selection = activeEditor.state?.selection
  if (selection?.from) {
    range.to = selection.from
  }

  return loadingId
}

const replaceGeneratedContent = (content, range, loadingId) => {
  const activeEditor = editor.value
  if (!activeEditor) {
    return
  }

  const targetRange = findAiLoadingRange(loadingId) || range
  activeEditor.chain().focus().insertContentAt({
    from: targetRange.from,
    to: targetRange.to,
  }, content).run()

  const selection = activeEditor.state?.selection
  if (selection?.from) {
    range.from = targetRange.from
    range.to = selection.from
  }
}

const handleAIGenerated = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: 'AI 生成内容',
    description: '输入生成要求，AI 返回的内容会插入到当前光标位置。',
    inputLabel: '生成提示词',
    placeholder: '例如：写一段产品介绍，语气专业简洁',
    confirmText: '生成',
    loadingText: '生成中...',
    closeOnConfirm: true,
    validate: (value) => value ? '' : '请输入生成提示词',
    onConfirm: async (prompt) => {
      const selection = editor.value?.state?.selection
      const generatedRange = {
        from: selection?.from || 0,
        to: selection?.to || selection?.from || 0,
      }
      let hasStreamingContent = false
      const loadingId = insertAiLoading(generatedRange)

      try {
        const content = await requestAiContent({
          ...props.aiConfig,
          prompt,
          onContent: ({ html }) => {
            if (!html) {
              return
            }

            hasStreamingContent = true
            replaceGeneratedContent(html, generatedRange, loadingId)
          },
        })

        if (hasStreamingContent) {
          replaceGeneratedContent(content, generatedRange, loadingId)
        } else {
          replaceGeneratedContent(content, generatedRange, loadingId)
        }
      } catch (error) {
        replaceGeneratedContent('', generatedRange, loadingId)
        showMessageDialog('AI 生成失败', error?.message || '请求失败，请稍后重试')
      }
    },
  })
}

// 暴露方法给外部
onMounted(() => {
  // 注册全局编辑器引用（向后兼容）
  if (typeof window !== 'undefined') {
    window.skyTiptapEditor = editor.value
  }

  // 添加全局点击事件监听（SSR 安全）
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleGlobalClick)
  }

  // 监听插入事件
  emitter.on('trigger-add-image', handleTriggerAddImage)
  emitter.on('trigger-upload-video', handleTriggerUploadVideo)
  emitter.on('trigger-add-bilibili', handleTriggerAddBilibili)
  emitter.on('trigger-add-youtube', handleTriggerAddYoutube)
  emitter.on('trigger-add-tiktok', handleTriggerAddTikTok)
  emitter.on('trigger-add-website', handleTriggerAddWebsite)
  emitter.on('AI-generated', handleAIGenerated)
})

onBeforeUnmount(() => {
  // 移除全局点击事件监听
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleGlobalClick)
  }

  emitter.off('trigger-add-image', handleTriggerAddImage)
  emitter.off('trigger-upload-video', handleTriggerUploadVideo)
  emitter.off('trigger-add-bilibili', handleTriggerAddBilibili)
  emitter.off('trigger-add-youtube', handleTriggerAddYoutube)
  emitter.off('trigger-add-tiktok', handleTriggerAddTikTok)
  emitter.off('trigger-add-website', handleTriggerAddWebsite)
  emitter.off('AI-generated', handleAIGenerated)
  if (typeof window !== 'undefined') {
    window.skyTiptapEditor = null
  }
})

// 导出方法（向后兼容）
defineExpose({
  insertImage: (url) => {
    editor.value?.chain().focus().setImage({ src: url }).run()
  },
  insertImages: (urls) => {
    const imageUrls = Array.isArray(urls) ? urls : [urls]
    imageUrls.filter(Boolean).forEach((url) => {
      editor.value?.chain().focus().setImage({ src: url }).run()
    })
  },
  insertVideo: (url) => {
    editor.value?.chain().focus().setUploadedVideo({ src: url }).run()
  },
  insertVideos: (urls) => {
    const videoUrls = Array.isArray(urls) ? urls : [urls]
    videoUrls.filter(Boolean).forEach((url) => {
      editor.value?.chain().focus().setUploadedVideo({ src: url }).run()
    })
  },
  insertGeneratedContent,
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
