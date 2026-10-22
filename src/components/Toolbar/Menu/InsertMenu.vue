<!-- InsertMenu.vue - 块插入菜单（「+」按钮 / 「/」快捷键共用） -->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="sky-insert-menu"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      @click.stop
      @keydown.stop
    >
      <div class="sky-insert-menu__search">
        <input
          ref="searchInputRef"
          v-model="query"
          class="sky-insert-menu__search-input"
          type="text"
          placeholder="搜索操作…"
          @keydown.enter.prevent="handleEnter"
          @keydown.esc.prevent="hide"
        />
      </div>

      <div class="sky-insert-menu__content">
        <template v-if="groupedItems.length">
          <div v-for="section in groupedItems" :key="section.group" class="sky-insert-menu__section">
            <div class="sky-insert-menu__title">{{ section.title }}</div>
            <button
              v-for="item in section.items"
              :key="item.type"
              class="sky-insert-menu__item"
              :class="{ 'sky-insert-menu__item--active': isActive(item) }"
              type="button"
              :disabled="item.disabled"
              @click="handleSelect(item)"
            >
              <svg v-html="icons[item.icon] || icons.menu" class="sky-insert-menu__icon"></svg>
              <span class="sky-insert-menu__label">{{ item.label }}</span>
            </button>
          </div>
        </template>

        <div v-else class="sky-insert-menu__empty">没有匹配的操作</div>
      </div>
    </div>

    <!-- 视频平台选择菜单 -->
    <div v-if="showVideoMenu" ref="videoMenuRef" class="sky-video-menu-overlay" @click="showVideoMenu = false">
      <div class="sky-video-menu" @click.stop>
        <div class="sky-video-menu__header">
          <span>选择视频平台</span>
          <button class="sky-video-menu__close" type="button" @click="showVideoMenu = false">
            <svg v-html="icons.close" class="sky-video-menu__icon"></svg>
          </button>
        </div>
        <button class="sky-video-menu__item" type="button" @click="insertVideo('bilibili')">
          Bilibili 视频
        </button>
        <button class="sky-video-menu__item" type="button" @click="insertVideo('youtube')">
          YouTube 视频
        </button>
        <button class="sky-video-menu__item" type="button" @click="insertVideo('tiktok')">
          抖音视频
        </button>
        <button class="sky-video-menu__item" type="button" @click="uploadVideo">
          上传视频
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { icons } from '../../../icons'
import { emitter } from '../../../utils/emitter'
import { insertBlock } from '../../../utils/block-insert'
import {
  INSERT_MENU_GROUPS,
  defaultInsertMenuItems,
  filterInsertMenuItems,
  groupInsertMenuItems,
} from '../../../config/insert-menu'

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
  /** 块目录，默认使用内置目录 */
  items: {
    type: Array,
    default: () => defaultInsertMenuItems,
  },
})

const visible = ref(false)
const position = ref({ top: 0, left: 0 })
const query = ref('')
const keepFocus = ref(false)
const menuRef = ref(null)
const searchInputRef = ref(null)
const videoMenuRef = ref(null)
const showVideoMenu = ref(false)
let insertCallback = null

const filteredItems = computed(() => filterInsertMenuItems(props.items, query.value))
const groupedItems = computed(() => groupInsertMenuItems(filteredItems.value, INSERT_MENU_GROUPS))

const isActive = (item) => {
  const type = String(item?.type || '')
  if (type.startsWith('heading')) {
    const level = Number(type.replace('heading', ''))
    return props.editor?.isActive?.('heading', { level })
  }
  if (type === 'text') {
    return props.editor?.isActive?.('paragraph')
  }
  return false
}

/** 视口收敛，避免菜单溢出屏幕 */
const clampPosition = async () => {
  await nextTick()

  const element = menuRef.value
  if (!element || typeof element.getBoundingClientRect !== 'function') {
    return
  }

  const rect = element.getBoundingClientRect()
  const margin = 8
  let { top, left } = position.value

  if (rect.width && left + rect.width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - rect.width - margin)
  }

  if (rect.height && top + rect.height > window.innerHeight - margin) {
    top = Math.max(margin, window.innerHeight - rect.height - margin)
  }

  position.value = { top, left }
}

const focusSearch = async () => {
  if (keepFocus.value) {
    return
  }

  await nextTick()
  searchInputRef.value?.focus?.()
}

const show = (options) => {
  if (options && options.type) {
    // 事件对象：工具栏触发的视频平台菜单
    showVideoMenu.value = true
    visible.value = false
    return
  }

  if (options && options.position) {
    position.value = { ...options.position }
    insertCallback = typeof options.insert === 'function' ? options.insert : null
    query.value = options.query || ''
    keepFocus.value = options.keepFocus === true
    visible.value = true
    showVideoMenu.value = false
    clampPosition()
    focusSearch()
    return
  }

  showVideoMenu.value = true
  visible.value = false
}

const hide = (event) => {
  if (event && menuRef.value && menuRef.value.contains(event.target)) {
    return
  }
  if (event && videoMenuRef.value && videoMenuRef.value.contains(event.target)) {
    return
  }

  visible.value = false
  showVideoMenu.value = false
  query.value = ''
  insertCallback = null
}

const handleSelect = (item) => {
  if (!item || item.disabled) {
    return
  }

  if (insertCallback) {
    insertCallback(item.type)
  } else {
    insertBlock(props.editor, item.type)
  }

  hide()
}

const handleEnter = () => {
  const first = filteredItems.value[0]
  if (first) {
    handleSelect(first)
  }
}

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

const handleKeydown = (event) => {
  if (event.key === 'Escape' && visible.value) {
    event.stopPropagation()
    hide()
  }
}

const handleShowInsertMenu = (options) => {
  show(options)
}

const handleUpdateQuery = (value) => {
  query.value = typeof value === 'string' ? value : ''
}

const handleHideMenu = () => {
  visible.value = false
  showVideoMenu.value = false
  query.value = ''
  keepFocus.value = false
  insertCallback = null
}

const handleShowVideoMenu = () => {
  visible.value = false
  showVideoMenu.value = true
}

watch(showVideoMenu, (value) => {
  if (value) {
    visible.value = false
  }
})

onMounted(() => {
  emitter.on('show-insert-menu', handleShowInsertMenu)
  emitter.on('update-insert-menu-query', handleUpdateQuery)
  emitter.on('hide-insert-menu', handleHideMenu)
  emitter.on('show-video-menu', handleShowVideoMenu)
  document.addEventListener('mousedown', hide)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  emitter.off('show-insert-menu', handleShowInsertMenu)
  emitter.off('update-insert-menu-query', handleUpdateQuery)
  emitter.off('hide-insert-menu', handleHideMenu)
  emitter.off('show-video-menu', handleShowVideoMenu)
  document.removeEventListener('mousedown', hide)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.sky-insert-menu {
  position: fixed;
  width: 265px;
  max-height: 60vh;
  overflow-y: auto;
  background: var(--sky-color-bg);
  border-radius: var(--sky-radius-md);
  box-shadow: var(--sky-shadow-lg);
  border: 1px solid var(--sky-color-border);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: var(--sky-z-dropdown);
  animation: sky-insert-menu-in 0.15s ease-out;
}

@keyframes sky-insert-menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sky-insert-menu__search {
  padding: 4px 4px 8px;
}

.sky-insert-menu__search-input {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--sky-color-border);
  border-radius: var(--sky-radius-sm);
  background: var(--sky-color-bg-secondary);
  color: var(--sky-color-text);
  font-size: var(--sky-font-size-sm);
  outline: none;
}

.sky-insert-menu__search-input:focus {
  border-color: var(--sky-color-primary);
}

.sky-insert-menu__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sky-insert-menu__section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sky-insert-menu__title {
  padding: 6px 8px 2px;
  font-size: var(--sky-font-size-xs);
  color: var(--sky-color-text-muted);
}

.sky-insert-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--sky-radius-sm);
  transition: background var(--sky-transition-fast);
  text-align: left;
  width: 100%;
  font-size: var(--sky-font-size-sm);
  color: var(--sky-color-text);
  background: transparent;
  border: none;
  cursor: pointer;
}

.sky-insert-menu__item:hover:not(:disabled) {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-insert-menu__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sky-insert-menu__item--active {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-insert-menu__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sky-insert-menu__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--sky-color-text-secondary);
}

.sky-insert-menu__empty {
  padding: 12px 8px;
  text-align: center;
  font-size: var(--sky-font-size-sm);
  color: var(--sky-color-text-muted);
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
