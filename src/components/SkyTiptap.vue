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

    <!-- 拖拽手柄 -->
    <DragHandle
      v-if="editor && draggableBlockCount > 1"
      :editor="editor"
      :class="dragHandleClass"
      :tippy-options="dragHandleTippyOptions"
      :on-node-change="handleDragNodeChange"
    >
      <div
        class="sky-drag-handle"
        role="button"
        :aria-label="activeDragNodeLabel"
        title="拖拽调整区块位置"
        @click.stop
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="8" cy="6" r="1.5" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="8" cy="18" r="1.5" />
          <circle cx="16" cy="6" r="1.5" />
          <circle cx="16" cy="12" r="1.5" />
          <circle cx="16" cy="18" r="1.5" />
        </svg>
      </div>
    </DragHandle>

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
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { emitter } from '../utils/emitter'
import { TipTapPlugin } from '../config/default'
import Toolbar from './Toolbar/Toolbar.vue'
import BubbleMenuWrapper from './BubbleMenu/BubbleMenu.vue'
import InsertMenu from './Toolbar/Menu/InsertMenu.vue'
import SkyDialog from './Dialog/SkyDialog.vue'
import { renderMarkdown, requestAiContent } from '../utils/ai'
import { describeAiActions, executeAiActions } from '../utils/ai-actions'
import { resolveActionsFromAiText, resolveActionsFromText } from '../utils/ai-intent'

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

const emit = defineEmits(['update:modelValue', 'uploadPhoto', 'uploadVideo', 'paste', 'drop', 'ready', 'focus', 'blur', 'selectionChange', 'linkClick'])

const fileInputRef = ref(null)
const videoInputRef = ref(null)
const draggableBlockCount = ref(0)
const activeDragNodeName = ref('')
const isActiveDragNodeDraggable = ref(true)

const NON_DRAGGABLE_NODE_NAMES = new Set(['doc', 'text', 'aiLoading'])
const DRAG_NODE_LABELS = {
  paragraph: '段落',
  heading: '标题',
  blockquote: '引用',
  bulletList: '无序列表',
  orderedList: '有序列表',
  listItem: '列表项',
  codeBlock: '代码块',
  table: '表格',
  image: '图片',
  videoEmbed: '视频',
  iframe: '网页嵌入',
  horizontalRule: '分割线',
}
const dragHandleTippyOptions = {
  placement: 'left-start',
  offset: [3, 36],
  duration: 100,
  zIndex: 110,
}

const isDraggableBlockNode = (node) => {
  return Boolean(node?.isBlock && !NON_DRAGGABLE_NODE_NAMES.has(node.type?.name))
}

const getDraggableTopLevelBlockCount = (activeEditor = editor.value) => {
  const doc = activeEditor?.state?.doc
  if (!doc) return 0

  if (typeof doc.forEach !== 'function') {
    return doc.childCount || 0
  }

  let count = 0
  doc.forEach((node) => {
    if (isDraggableBlockNode(node)) {
      count += 1
    }
  })

  return count
}

function refreshDraggableBlockCount(activeEditor = editor.value) {
  draggableBlockCount.value = getDraggableTopLevelBlockCount(activeEditor)
}

const dragHandleClass = computed(() => [
  'sky-drag-handle-wrapper',
  isActiveDragNodeDraggable.value ? '' : 'sky-drag-handle-wrapper--hidden',
].filter(Boolean).join(' '))

const activeDragNodeLabel = computed(() => {
  const label = DRAG_NODE_LABELS[activeDragNodeName.value] || '区块'
  return `拖拽调整${label}位置`
})

const handleDragNodeChange = ({ node }) => {
  activeDragNodeName.value = node?.type?.name || ''
  isActiveDragNodeDraggable.value = !node || isDraggableBlockNode(node)
}

const findClickedLink = (event) => {
  const target = event?.target
  if (!target) return null

  if (typeof target.closest === 'function') {
    return target.closest('a')
  }

  return target.parentElement?.closest?.('a') || null
}

const handleEditorClick = (view, pos, event) => {
  const link = findClickedLink(event)

  if (link) {
    let prevented = false
    emit('linkClick', {
      event,
      target: link,
      href: link.getAttribute('href') || '',
      pos,
      ctrlKey: Boolean(event?.ctrlKey),
      metaKey: Boolean(event?.metaKey),
      preventDefault: () => {
        prevented = true
        event?.preventDefault?.()
      },
    })

    if (prevented || event?.defaultPrevented) {
      return true
    }
  }

  return TipTapPlugin.editorProps?.handleClick?.(view, pos, event) || false
}

// 创建编辑器实例
const editor = useEditor({
  ...TipTapPlugin,
  content: props.modelValue,
  onUpdate: ({ editor }) => {
    refreshDraggableBlockCount(editor)
    emit('update:modelValue', editor.getHTML())
  },
  onCreate: ({ editor }) => {
    refreshDraggableBlockCount(editor)
    emit('ready')
  },
  onFocus: () => {
    emit('focus')
  },
  onBlur: () => {
    emit('blur')
  },
  onSelectionUpdate: ({ editor }) => {
    const { from, to, empty } = editor.state.selection
    const text = empty ? '' : editor.state.doc.textBetween(from, to, ' ')
    emit('selectionChange', { from, to, text, empty })
  },
  editorProps: {
    ...TipTapPlugin.editorProps,
    handleClick: handleEditorClick,
    handlePaste: (view, event) => {
      const files = Array.from(event.clipboardData?.files || [])
      const text = event.clipboardData?.getData('text/plain') || ''
      const html = event.clipboardData?.getData('text/html') || ''
      const type = files.length
        ? files.some(f => f.type.startsWith('image/')) ? 'image' : 'mixed'
        : html ? 'html' : 'text'
      let prevented = false
      emit('paste', {
        event,
        type,
        files,
        text,
        html,
        preventDefault: () => { prevented = true },
        handled: false,
      })
      return prevented
    },
    handleDrop: (view, event) => {
      const files = Array.from(event.dataTransfer?.files || [])
      if (!files.length) return false
      let prevented = false
      emit('drop', {
        event,
        files,
        type: files.some(f => f.type.startsWith('image/')) ? 'image' : 'file',
        preventDefault: () => { prevented = true },
      })
      return prevented
    },
  },
})

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue)
    refreshDraggableBlockCount()
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

const confirmActionPreview = (actions) => {
  return new Promise((resolve) => {
    emitter.emit('open-dialog', {
      mode: 'message',
      title: '确认执行操作',
      description: '项目已把输入解析为以下受控编辑器操作。',
      message: describeAiActions(actions).map((item, index) => `${index + 1}. ${item}`).join('\n'),
      confirmText: props.aiConfig?.executeActions === false ? '知道了' : '执行',
      cancelText: props.aiConfig?.executeActions === false ? '关闭' : '取消',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

const showActionResultDialog = (result) => {
  const summary = Array.isArray(result?.summary) ? result.summary : []
  showMessageDialog(
    result?.ok ? 'AI 操作完成' : 'AI 操作失败',
    summary.length ? summary.map((item, index) => `${index + 1}. ${item}`).join('\n') : (result?.message || '没有可显示的操作结果')
  )
}

const hasFollowUpAction = (actions) => {
  return actions.some((action) => typeof action?.type === 'string' && action.type.startsWith('request'))
}

const handleTriggerAddImageUrl = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '插入图片',
    description: '输入图片 URL，编辑器会直接插入该图片。',
    inputLabel: '图片 URL',
    placeholder: 'https://example.com/image.png',
    confirmText: '插入',
    validate: (value) => value ? '' : '请输入图片 URL',
    onConfirm: (url) => {
      editor.value?.chain().focus().setImage({ src: url }).run()
    },
  })
}

const handleTriggerAddUploadedVideoUrl = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '插入视频',
    description: '输入已上传的视频 URL，编辑器会直接插入该视频。',
    inputLabel: '视频 URL',
    placeholder: 'https://example.com/video.mp4',
    confirmText: '插入',
    validate: (value) => value ? '' : '请输入视频 URL',
    onConfirm: (url) => {
      editor.value?.chain().focus().setUploadedVideo({ src: url }).run()
    },
  })
}

const handleTriggerAddLink = () => {
  emitter.emit('open-dialog', {
    mode: 'input',
    title: '设置链接',
    description: '输入链接地址，编辑器会应用到当前选区。',
    inputLabel: '链接地址',
    placeholder: 'https://example.com',
    confirmText: '设置',
    validate: (value) => value ? '' : '请输入链接地址',
    onConfirm: (url) => {
      editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
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

const requestAndExecuteAiActions = async (prompt, generatedRange, loadingId, { fallbackToContent = false } = {}) => {
  const executeActions = async (actions) => {
    const shouldPreviewActions = props.aiConfig?.previewActions === true || props.aiConfig?.executeActions === false
    const shouldExecuteActions = props.aiConfig?.executeActions !== false
    const shouldRollbackActions = props.aiConfig?.rollbackOnActionFailure !== false
    const shouldShowActionResult = props.aiConfig?.showActionResult === true

    replaceGeneratedContent('', generatedRange, loadingId)

    if (shouldPreviewActions) {
      const confirmed = await confirmActionPreview(actions)
      if (!confirmed || !shouldExecuteActions) {
        return
      }
    }

    const snapshot = shouldRollbackActions ? editor.value?.getHTML?.() : null
    const result = executeAiActions(editor.value, actions, {
      requestImageUpload: handleTriggerAddImage,
      requestVideoUpload: handleTriggerUploadVideo,
      requestImageUrl: handleTriggerAddImageUrl,
      requestUploadedVideoUrl: handleTriggerAddUploadedVideoUrl,
      requestBilibiliVideo: handleTriggerAddBilibili,
      requestYoutubeVideo: handleTriggerAddYoutube,
      requestDouyinVideo: handleTriggerAddTikTok,
      requestIframeUrl: handleTriggerAddWebsite,
      requestLink: handleTriggerAddLink,
    })
    if (!result.ok) {
      if (shouldRollbackActions && snapshot !== null && snapshot !== undefined) {
        editor.value?.commands?.setContent?.(snapshot)
      }
      throw new Error(result.message || 'AI 操作执行失败')
    }

    if (shouldShowActionResult && !hasFollowUpAction(actions)) {
      showActionResultDialog(result)
    }
  }

  const promptActions = resolveActionsFromText(prompt)
  if (promptActions.length) {
    await executeActions(promptActions)
    return
  }

  const responseText = await requestAiContent({
    ...props.aiConfig,
    prompt,
    forceTextResponse: true,
    parseResponse: props.aiConfig.parseResponse || ((text) => text),
  })
  const actions = resolveActionsFromAiText(responseText)

  if (!actions.length) {
    if (fallbackToContent) {
      replaceGeneratedContent(renderMarkdown(responseText), generatedRange, loadingId)
      return
    }

    throw new Error('未识别到可执行的编辑器操作')
  }

  await executeActions(actions)
}

const handleAIGenerated = () => {
  const aiMode = props.aiConfig?.mode || 'content'
  const isActionsMode = aiMode === 'actions'
  const isAutoMode = aiMode === 'auto'
  const isEditorIntentMode = isActionsMode || isAutoMode

  emitter.emit('open-dialog', {
    mode: 'input',
    title: isEditorIntentMode ? 'AI 操控编辑器' : 'AI 生成内容',
    description: isEditorIntentMode ? '输入编辑需求，项目会优先识别并执行受控编辑器操作。' : '输入生成要求，AI 返回的内容会插入到当前光标位置。',
    inputLabel: isEditorIntentMode ? '编辑需求' : '生成提示词',
    placeholder: isEditorIntentMode ? '例如：插入抖音视频：https://www.douyin.com/video/...' : '例如：写一段产品介绍，语气专业简洁',
    confirmText: isEditorIntentMode ? '执行' : '生成',
    loadingText: isEditorIntentMode ? '执行中...' : '生成中...',
    closeOnConfirm: true,
    validate: (value) => value ? '' : (isEditorIntentMode ? '请输入编辑需求' : '请输入生成提示词'),
    onConfirm: async (prompt) => {
      const selection = editor.value?.state?.selection
      const generatedRange = {
        from: selection?.from || 0,
        to: selection?.to || selection?.from || 0,
      }
      let hasStreamingContent = false
      const loadingId = insertAiLoading(generatedRange)

      try {
        if (isEditorIntentMode) {
          await requestAndExecuteAiActions(prompt, generatedRange, loadingId, {
            fallbackToContent: isAutoMode,
          })
          return
        }

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
        showMessageDialog(isEditorIntentMode ? 'AI 操作失败' : 'AI 生成失败', error?.message || '请求失败，请稍后重试')
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

  refreshDraggableBlockCount()

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
