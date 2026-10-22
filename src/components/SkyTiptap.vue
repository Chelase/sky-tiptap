<!-- SkyTiptap.vue - 主编辑器组件 -->
<template>
  <div class="sky-tiptap-wrapper" :data-theme="theme">
    <!-- 工具栏 -->
    <Toolbar v-if="showToolbar && editor" :editor="editor" />

    <!-- 编辑器内容区域 -->
    <div class="sky-editor">
      <editor-content :editor="editor" />
    </div>

    <!-- 悬浮菜单 -->
    <BubbleMenuWrapper v-if="editor" :editor="editor" />

    <!-- 插入菜单 -->
    <InsertMenu v-if="editor" :editor="editor" :items="insertMenuItems" />

    <!-- 块级「+」按钮 -->
    <BlockAddButton v-if="editor" :editor="editor" :capabilities="blockCapabilities" />

    <!-- 拖拽手柄 -->
    <DragHandle
      v-if="editor && draggableBlockCount > 1"
      :editor="editor"
      :class="dragHandleClass"
      :plugin-key="dragHandlePluginKey"
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
import Placeholder from '@tiptap/extension-placeholder'
import { emitter } from '../utils/emitter'
import { TipTapPlugin } from '../config/default'
import Toolbar from './Toolbar/Toolbar.vue'
import BubbleMenuWrapper from './BubbleMenu/BubbleMenu.vue'
import InsertMenu from './Toolbar/Menu/InsertMenu.vue'
import BlockAddButton from './BlockControls/BlockAddButton.vue'
import SkyDialog from './Dialog/SkyDialog.vue'
import BeforeChange from '@sky-tiptap/extension-before-change'
import { createAiFlow } from '../utils/ai-flow'
import { insertBlock } from '../utils/block-insert'
import { findCurrentTopLevelBlock } from '../utils/block-actions'
import { locateBlockControls, getDragHandleOffset } from '../utils/block-gutter'
import { createBlockKeyboardShortcuts } from '../utils/keyboard-shortcuts'
import { createLinkDialogPayload } from '../utils/link-dialog'
import { getTextBeforeCursor, parseSlashCommand } from '../utils/slash-menu'
import { defaultInsertMenuItems } from '../config/insert-menu'
import { canDragNode } from '../config/block-capabilities'
import { registerEditor, unregisterEditor, setActiveEditor } from '../utils/editor-registry'

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
  },
  /** 块目录（「+」按钮与「/」菜单共用的可搜索块列表） */
  insertMenuItems: {
    type: Array,
    default: () => [...defaultInsertMenuItems],
  },
  /** 块能力覆盖配置，形如 { paragraph: { canDrag: false } } */
  blockCapabilities: {
    type: Object,
    default: () => ({}),
  }
})

const emit = defineEmits(['update:modelValue', 'uploadPhoto', 'uploadVideo', 'paste', 'drop', 'ready', 'focus', 'blur', 'selectionChange', 'linkClick', 'beforeChange'])

const fileInputRef = ref(null)
const videoInputRef = ref(null)
const draggableBlockCount = ref(0)
const activeDragNodeName = ref('')
const isActiveDragNodeDraggable = ref(true)

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
  columnList: '多栏',
}
const dragHandleTippyOptions = {
  placement: 'left-start',
  offset: getDragHandleOffset(),
  duration: 100,
  zIndex: 110,
}
// 每个编辑器实例使用独立的插件 key，避免多实例互相覆盖
const dragHandlePluginKey = `dragHandle-${Math.random().toString(36).slice(2, 10)}`

const isDraggableBlockNode = (node) => {
  if (!node?.isBlock) {
    return false
  }

  return canDragNode(node, props.blockCapabilities)
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

const handleBeforeChange = (payload) => {
  let prevented = false

  emit('beforeChange', {
    ...payload,
    preventDefault: () => {
      prevented = true
      payload.preventDefault()
    },
  })

  return prevented
}

// 打开块插入菜单（⌘/ 或 Ctrl+/）
const openInsertMenu = (options = {}) => {
  const activeEditor = editor.value
  if (!activeEditor) {
    return
  }

  const info = findCurrentTopLevelBlock(activeEditor)
  const controls = info ? locateBlockControls(activeEditor.view, info) : null
  const position = controls ? controls.menu : { top: 100, left: 100 }

  emitter.emit('show-insert-menu', {
    position,
    query: options.query || '',
    keepFocus: options.keepFocus === true,
    insert:
      options.insert ||
      ((type) => {
        insertBlock(activeEditor, type, { insertAt: info ? info.end : undefined })
      }),
  })
}

// 关闭块插入菜单
const closeInsertMenu = () => {
  emitter.emit('hide-insert-menu')
}

// Slash 菜单状态
const slashState = ref({ active: false, query: '', from: 0, to: 0 })

const closeSlashMenu = () => {
  if (!slashState.value.active) {
    return
  }

  slashState.value = { active: false, query: '', from: 0, to: 0 }
  closeInsertMenu()
}

/** 同步 slash 菜单：当前块在光标处输入 `/` 时唤起块目录 */
const syncSlashMenu = () => {
  const activeEditor = editor.value
  if (!activeEditor) {
    return
  }

  const text = getTextBeforeCursor(activeEditor)
  const parsed = parseSlashCommand(text)

  if (!parsed) {
    closeSlashMenu()
    return
  }

  const { from } = activeEditor.state.selection
  const blockStart = Math.max(0, from - text.length)

  if (!slashState.value.active) {
    slashState.value = { active: true, query: parsed.query, from: blockStart, to: from }

    openInsertMenu({
      query: parsed.query,
      keepFocus: true,
      insert: (type) => {
        const range = slashState.value

        if (range.active && range.from < range.to) {
          activeEditor.chain().focus().deleteRange({ from: range.from, to: range.to }).run()
          insertBlock(activeEditor, type, { insertAt: range.from })
        } else {
          insertBlock(activeEditor, type)
        }

        closeSlashMenu()
      },
    })

    return
  }

  if (slashState.value.query !== parsed.query) {
    slashState.value = { ...slashState.value, query: parsed.query, to: from }
    emitter.emit('update-insert-menu-query', parsed.query)
  }
}

// 打开链接设置（⌘K 或 Ctrl+K）
const openLinkDialog = () => {
  const activeEditor = editor.value
  if (!activeEditor) {
    return
  }

  emitter.emit('open-dialog', createLinkDialogPayload(activeEditor))
}

const handleKeyDown = (view, event) => {
  const handler = createBlockKeyboardShortcuts(editor.value, {
    openInsertMenu: () => openInsertMenu(),
    openLink: openLinkDialog,
    onEscape: () => {
      if (!slashState.value.active) {
        return false
      }

      closeSlashMenu()
      return true
    },
  })

  return handler(view, event)
}

// 创建编辑器实例
const editor = useEditor({
  ...TipTapPlugin,
  extensions: [
    ...TipTapPlugin.extensions,
    Placeholder.configure({
      placeholder: () => props.placeholder,
    }),
    BeforeChange.configure({
      onBeforeChange: handleBeforeChange,
    }),
  ],
  content: props.modelValue,
  onUpdate: ({ editor }) => {
    refreshDraggableBlockCount(editor)
    emit('update:modelValue', editor.getHTML())
    syncSlashMenu()
  },
  onCreate: ({ editor }) => {
    refreshDraggableBlockCount(editor)
    emit('ready')
  },
  onFocus: () => {
    setActiveEditor(editor.value)
    emit('focus')
  },
  onBlur: () => {
    emit('blur')
  },
  onSelectionUpdate: ({ editor }) => {
    const { from, to, empty } = editor.state.selection
    const text = empty ? '' : editor.state.doc.textBetween(from, to, ' ')
    emit('selectionChange', { from, to, text, empty })
    syncSlashMenu()
  },
  editorProps: {
    ...TipTapPlugin.editorProps,
    handleClick: handleEditorClick,
    handleKeyDown,
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

watch(() => props.placeholder, () => {
  const activeEditor = editor.value
  const transaction = activeEditor?.state?.tr

  if (!activeEditor?.isDestroyed && transaction && typeof activeEditor?.view?.dispatch === 'function') {
    activeEditor.view.dispatch(transaction)
  }
})

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

// AI 流程（内容生成 + 操控编辑器）
const aiFlow = createAiFlow({
  getEditor: () => editor.value,
  getAiConfig: () => props.aiConfig,
  showMessageDialog,
  requestHandlers: {
    requestImageUpload: handleTriggerAddImage,
    requestVideoUpload: handleTriggerUploadVideo,
    requestImageUrl: handleTriggerAddImageUrl,
    requestUploadedVideoUrl: handleTriggerAddUploadedVideoUrl,
    requestBilibiliVideo: handleTriggerAddBilibili,
    requestYoutubeVideo: handleTriggerAddYoutube,
    requestDouyinVideo: handleTriggerAddTikTok,
    requestIframeUrl: handleTriggerAddWebsite,
    requestLink: handleTriggerAddLink,
  },
})

const handleAIGenerated = aiFlow.handleAIGenerated
const insertGeneratedContent = aiFlow.insertGeneratedContent

// 暴露方法给外部
onMounted(() => {
  // 注册全局编辑器引用（向后兼容）+ 登记到实例注册表
  if (typeof window !== 'undefined') {
    window.skyTiptapEditor = editor.value
  }

  registerEditor(editor.value)

  refreshDraggableBlockCount()

  // 监听插入事件
  emitter.on('trigger-add-image', handleTriggerAddImage)
  emitter.on('trigger-upload-video', handleTriggerUploadVideo)
  emitter.on('trigger-add-bilibili', handleTriggerAddBilibili)
  emitter.on('trigger-add-youtube', handleTriggerAddYoutube)
  emitter.on('trigger-add-tiktok', handleTriggerAddTikTok)
  emitter.on('trigger-add-website', handleTriggerAddWebsite)
  emitter.on('AI-generated', handleAIGenerated)
  emitter.on('ai-generate', handleAIGenerated)
})

onBeforeUnmount(() => {
  emitter.off('trigger-add-image', handleTriggerAddImage)
  emitter.off('trigger-upload-video', handleTriggerUploadVideo)
  emitter.off('trigger-add-bilibili', handleTriggerAddBilibili)
  emitter.off('trigger-add-youtube', handleTriggerAddYoutube)
  emitter.off('trigger-add-tiktok', handleTriggerAddTikTok)
  emitter.off('trigger-add-website', handleTriggerAddWebsite)
  emitter.off('AI-generated', handleAIGenerated)
  emitter.off('ai-generate', handleAIGenerated)
  unregisterEditor(editor.value)
  if (typeof window !== 'undefined' && window.skyTiptapEditor === editor.value) {
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
