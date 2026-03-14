<!-- InsertMenu.vue - 插入菜单组件 -->
<template>
  <div
    v-if="visible"
    class="sky-insert-menu"
    :style="{
      top: `${position.top}px`,
      left: `${position.left}px`
    }"
    @click.stop
  >
    <div class="sky-insert-menu__section">
      <div class="sky-insert-menu__title">插入媒体</div>
      <button @click="insert('image')" class="sky-insert-menu__item">
        <svg v-html="icons.image" class="sky-insert-menu__icon"></svg>
        <span>图片</span>
      </button>
      <button @click="showVideoMenu = true" class="sky-insert-menu__item">
        <svg v-html="icons.video" class="sky-insert-menu__icon"></svg>
        <span>视频</span>
      </button>
    </div>
    
    <div class="sky-insert-menu__section">
      <div class="sky-insert-menu__title">插入内容</div>
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
    </div>
    
    <div class="sky-insert-menu__section">
      <div class="sky-insert-menu__title">AI 功能</div>
      <button @click="insert('ai')" class="sky-insert-menu__item sky-insert-menu__item--ai">
        <svg v-html="icons.ai" class="sky-insert-menu__icon"></svg>
        <span>AI 生成</span>
      </button>
    </div>
  </div>
  
  <!-- 视频平台选择菜单 -->
  <div v-if="showVideoMenu" class="sky-video-menu-overlay" @click="showVideoMenu = false">
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
      <button @click="insertVideo('website')" class="sky-video-menu__item">
        嵌入网站
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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
const showVideoMenu = ref(false)
let insertCallback = null

// 显示菜单
const show = (options) => {
  position.value = options.position
  insertCallback = options.insert
  visible.value = true
}

// 隐藏菜单
const hide = () => {
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
    // TODO: 实现表格插入
    console.log('插入表格')
  }
  hide()
}

// 插入视频
const insertVideo = (platform) => {
  emitter.emit(`trigger-add-${platform}`)
  showVideoMenu.value = false
  hide()
}

// 键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    hide()
  }
}

onMounted(() => {
  emitter.on('show-insert-menu', show)
  document.addEventListener('click', hide)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  emitter.off('show-insert-menu', show)
  document.removeEventListener('click', hide)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

.sky-insert-menu {
  position: fixed;
  background: var(--sky-color-bg);
  border-radius: var(--sky-radius-lg);
  box-shadow: var(--sky-shadow-xl);
  border: 1px solid var(--sky-color-border);
  padding: var(--sky-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--sky-spacing-md);
  z-index: var(--sky-z-dropdown);
  min-width: 200px;
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

.sky-insert-menu__section {
  display: flex;
  flex-direction: column;
  gap: var(--sky-spacing-xs);
}

.sky-insert-menu__title {
  font-size: var(--sky-font-size-xs);
  font-weight: 600;
  color: var(--sky-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 var(--sky-spacing-sm);
}

.sky-insert-menu__item {
  display: flex;
  align-items: center;
  gap: var(--sky-spacing-sm);
  padding: var(--sky-spacing-sm) var(--sky-spacing-md);
  border-radius: var(--sky-radius-md);
  transition: all var(--sky-transition-fast);
  text-align: left;
  width: 100%;
  font-size: var(--sky-font-size-sm);
  color: var(--sky-color-text);
}

.sky-insert-menu__item:hover {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-insert-menu__item--ai {
  color: var(--sky-color-primary);
}

.sky-insert-menu__item--ai:hover {
  background-color: var(--sky-color-primary);
  color: white;
}

.sky-insert-menu__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
