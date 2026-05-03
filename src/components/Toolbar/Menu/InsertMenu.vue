<!-- InsertMenu.vue - 插入菜单组件 -->
<template>
  <div
    v-if="visible"
    ref="menuRef"
    class="sky-insert-menu"
    :style="{
      top: `${position.top}px`,
      left: `${position.left}px`
    }"
    @click.stop
  >
    <div class="sky-insert-menu__header">插入</div>
    
    <div class="sky-insert-menu__content">
      <button @click="insert('image')" class="sky-insert-menu__item">
        <svg v-html="icons.image" class="sky-insert-menu__icon"></svg>
        <span>图片</span>
      </button>
      <button @click="showVideoMenu = true" class="sky-insert-menu__item">
        <svg v-html="icons.video" class="sky-insert-menu__icon"></svg>
        <span>视频</span>
      </button>
      <button @click="insertVideo('website')" class="sky-insert-menu__item">
        <svg v-html="icons.website" class="sky-insert-menu__icon"></svg>
        <span>嵌入网站</span>
      </button>
      <button @click="insert('codeBlock')" class="sky-insert-menu__item">
        <svg v-html="icons.code" class="sky-insert-menu__icon"></svg>
        <span>代码块</span>
      </button>
      <button @click="insert('table')" class="sky-insert-menu__item">
        <svg v-html="icons.table" class="sky-insert-menu__icon"></svg>
        <span>表格</span>
      </button>
      <button @click="insert('divider')" class="sky-insert-menu__item">
        <svg v-html="icons.divider" class="sky-insert-menu__icon"></svg>
        <span>分割线</span>
      </button>
      <button @click="insert('ai')" class="sky-insert-menu__item sky-insert-menu__item--ai">
        <svg v-html="icons.ai" class="sky-insert-menu__icon"></svg>
        <span>AI 生成</span>
      </button>
    </div>
  </div>
  
  <!-- 视频平台选择菜单 -->
  <div v-if="showVideoMenu" ref="videoMenuRef" class="sky-video-menu-overlay" @click="showVideoMenu = false">
    <div class="sky-video-menu" @click.stop>
      <div class="sky-video-menu__header">
        <span>选择视频平台</span>
        <button @click="showVideoMenu = false" class="sky-video-menu__close">
          <svg v-html="icons.close" class="sky-video-menu__icon"></svg>
        </button>
      </div>
      <button @click="insertVideo('bilibili')" class="sky-video-menu__item">
        Bilibili 视频
      </button>
      <button @click="insertVideo('youtube')" class="sky-video-menu__item">
        YouTube 视频
      </button>
      <button @click="insertVideo('tiktok')" class="sky-video-menu__item">
        抖音视频
      </button>
      <button @click="uploadVideo" class="sky-video-menu__item">
        上传视频
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { icons } from '../../../icons'
import { emitter } from '../../../utils/emitter'

const props = defineProps({
  editor: {
    type: Object,
    required: true
  }
})

const visible = ref(false)
const position = ref({ top: 0, left: 0 })
const menuRef = ref(null)
const videoMenuRef = ref(null)
const showVideoMenu = ref(false)
let insertCallback = null

// 显示菜单
const show = (options) => {
  // 如果 options 是事件对象（从 emit 传递过来的），则设置默认位置
  if (options && options.type) { // Event object checking
    position.value = { 
      top: window.innerHeight / 2 - 100, 
      left: window.innerWidth / 2 - 140 
    }
    showVideoMenu.value = true
    visible.value = false // 此时不显示主菜单，只显示视频菜单
  } else if (options && options.position) {
    position.value = options.position
    insertCallback = options.insert
    visible.value = true
  } else {
    // 从工具栏按钮点击时，显示视频选择菜单
    showVideoMenu.value = true
    visible.value = false
  }
}

// 隐藏菜单
const hide = (e) => {
  // 点击在菜单内部，不关闭
  if (e && menuRef.value && menuRef.value.contains(e.target)) return
  // 点击在视频子菜单内部，不关闭
  if (e && videoMenuRef.value && videoMenuRef.value.contains(e.target)) return
  visible.value = false
  showVideoMenu.value = false
  emitter.emit('hide-all-paragraph-buttons')
}

// 插入操作
const insert = (type) => {
  if (type === 'image') {
    emitter.emit('trigger-add-image')
  } else if (type === 'ai') {
    emitter.emit('AI-generated')
  } else if (type === 'divider') {
    props.editor.chain().focus().setHorizontalRule().run()
  } else if (type === 'codeBlock') {
    props.editor.chain().focus().toggleCodeBlock().run()
  } else if (type === 'table') {
    // 插入一个 3x3 的表格
    props.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }
  hide()
}

// 插入视频
const insertVideo = (platform) => {
  emitter.emit(`trigger-add-${platform}`)
  showVideoMenu.value = false
  hide()
}

const uploadVideo = () => {
  emitter.emit('trigger-upload-video')
  showVideoMenu.value = false
  hide()
}

// 键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    hide()
  }
}

const handleShowInsertMenu = (options) => {
  if (options && options.position) {
    position.value = options.position
    insertCallback = options.insert
    visible.value = true
    showVideoMenu.value = false
  } else {
    show(options)
  }
}

const handleShowVideoMenu = () => {
  visible.value = false
  showVideoMenu.value = true
}

onMounted(() => {
  emitter.on('show-insert-menu', handleShowInsertMenu)
  emitter.on('show-video-menu', handleShowVideoMenu)
  document.addEventListener('mousedown', hide)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  emitter.off('show-insert-menu', handleShowInsertMenu)
  emitter.off('show-video-menu', handleShowVideoMenu)
  document.removeEventListener('mousedown', hide)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

.sky-insert-menu {
  position: fixed;
  background: var(--sky-color-bg);
  border-radius: var(--sky-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: var(--sky-z-dropdown);
  min-width: 180px;
  animation: slideIn 0.15s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sky-insert-menu__header {
  padding: 8px 12px;
  font-size: 14px;
  color: var(--sky-color-text-muted);
  border-bottom: 1px solid var(--sky-color-border);
  margin-bottom: 4px;
}

.sky-insert-menu__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Remove old section styles */
/* .sky-insert-menu__section { ... } */
/* .sky-insert-menu__title { ... } */

.sky-insert-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all var(--sky-transition-fast);
  text-align: left;
  width: 100%;
  font-size: 14px;
  color: var(--sky-color-text);
  background: transparent;
  border: none;
  cursor: pointer;
}

.sky-insert-menu__item:hover {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-insert-menu__item--ai {
  color: var(--sky-color-text);
}

.sky-insert-menu__item--ai:hover {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-insert-menu__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--sky-color-text-secondary);
}

/* 视频菜单 */
.sky-video-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--sky-z-modal);
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sky-video-menu {
  background: var(--sky-color-bg);
  border-radius: var(--sky-radius-xl);
  box-shadow: var(--sky-shadow-xl);
  padding: var(--sky-spacing-lg);
  min-width: 280px;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.sky-video-menu__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sky-spacing-lg);
  font-size: var(--sky-font-size-lg);
  font-weight: 600;
}

.sky-video-menu__close {
  padding: var(--sky-spacing-xs);
  border-radius: var(--sky-radius-md);
}

.sky-video-menu__close:hover {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-video-menu__icon {
  width: 20px;
  height: 20px;
}

.sky-video-menu__item {
  display: block;
  width: 100%;
  padding: var(--sky-spacing-md) var(--sky-spacing-lg);
  text-align: left;
  border-radius: var(--sky-radius-md);
  margin-bottom: var(--sky-spacing-xs);
  font-size: var(--sky-font-size-sm);
}

.sky-video-menu__item:hover {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-video-menu__item:last-child {
  margin-bottom: 0;
}
</style>
