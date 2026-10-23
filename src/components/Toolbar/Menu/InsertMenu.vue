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
      @keydown.esc.prevent="closeWithFocus()"
    >
      <div class="sky-insert-menu__search">
        <input
          ref="searchInputRef"
          v-model="query"
          class="sky-insert-menu__search-input"
          type="text"
          placeholder="搜索操作…"
          @keydown.enter.prevent="handleEnter"
          @keydown.esc.prevent="closeWithFocus()"
        />
      </div>

      <div ref="scrollRef" class="sky-insert-menu__scroll" @scroll="handleScroll">
        <div class="sky-insert-menu__list">
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
                <span class="sky-insert-menu__icon">
                  <svg v-html="icons[item.icon] || icons.menu"></svg>
                </span>
                <span class="sky-insert-menu__label">{{ item.label }}</span>
                <span v-if="shortcutOf(item)" class="sky-insert-menu__shortcut">{{ shortcutOf(item) }}</span>
              </button>
            </div>
          </template>

          <div v-else class="sky-insert-menu__empty">没有匹配的操作</div>
        </div>
      </div>

      <!-- 内部浮层滚动条：不占布局宽度，悬停菜单或滚动时淡入 -->
      <div
        v-show="scrollbar.visible"
        class="sky-insert-menu__scrollbar"
        :class="{ 'sky-insert-menu__scrollbar--active': scrollbarActive }"
        :style="{ top: `${scrollbar.trackTop}px`, height: `${scrollbar.trackHeight}px` }"
      >
        <div
          class="sky-insert-menu__scrollbar-thumb"
          :style="{ top: `${scrollbar.thumbTop}px`, height: `${scrollbar.thumbHeight}px` }"
          @pointerdown="startScrollbarDrag"
        ></div>
      </div>

      <div class="sky-insert-menu__footer">
        <button class="sky-insert-menu__item" type="button" @click="hide()">
          <span class="sky-insert-menu__label">关闭菜单</span>
          <span class="sky-insert-menu__shortcut">esc</span>
        </button>
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
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { icons } from '../../../icons'
import { emitter } from '../../../utils/emitter'
import { insertBlock } from '../../../utils/block-insert'
import {
  INSERT_MENU_GROUPS,
  defaultInsertMenuItems,
  filterInsertMenuItems,
  groupInsertMenuItems,
} from '../../../config/insert-menu'
import { getBlockShortcut } from '../../../config/block-catalog'

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

/* ===== 内部浮层滚动条 =====
   列表用原生滚动但隐藏原生滚动条，改为在面板内画一条 4px 滑块：
   不占布局宽度（行、搜索框、底部行都能铺到面板内边距边），
   悬停菜单或滚动时淡入，可拖拽。 */
const scrollRef = ref(null)
const scrollbarActive = ref(false)
const scrollbar = reactive({ visible: false, trackTop: 0, trackHeight: 0, thumbTop: 0, thumbHeight: 0 })
const SCROLLBAR_MIN_THUMB = 28
let scrollbarTimer = null
let scrollbarDrag = null

const updateScrollbar = () => {
  const scroller = scrollRef.value
  const menu = menuRef.value
  if (!scroller || !menu) {
    scrollbar.visible = false
    return
  }

  const viewport = scroller.clientHeight
  const content = scroller.scrollHeight
  const maxScroll = content - viewport
  if (!viewport || maxScroll <= 1) {
    scrollbar.visible = false
    return
  }

  const thumbHeight = Math.min(
    viewport,
    Math.max(SCROLLBAR_MIN_THUMB, Math.round((viewport / content) * viewport)),
  )
  const maxThumbTop = viewport - thumbHeight
  const scrollTop = Math.min(Math.max(scroller.scrollTop, 0), maxScroll)

  scrollbar.trackTop = Math.round(scroller.getBoundingClientRect().top - menu.getBoundingClientRect().top)
  scrollbar.trackHeight = viewport
  scrollbar.thumbHeight = thumbHeight
  scrollbar.thumbTop = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * maxThumbTop) : 0
  scrollbar.visible = true
}

const revealScrollbar = () => {
  scrollbarActive.value = true
  if (scrollbarTimer) {
    clearTimeout(scrollbarTimer)
  }
  scrollbarTimer = setTimeout(() => {
    scrollbarActive.value = false
    scrollbarTimer = null
  }, 700)
}

const handleScroll = () => {
  updateScrollbar()
  revealScrollbar()
}

const handleScrollbarDrag = (event) => {
  const scroller = scrollRef.value
  if (!scroller || !scrollbarDrag) {
    return
  }

  const maxThumbTop = Math.max(1, scrollbarDrag.trackHeight - scrollbarDrag.thumbHeight)
  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  const delta = event.clientY - scrollbarDrag.startY
  scroller.scrollTop = scrollbarDrag.startScrollTop + (delta / maxThumbTop) * maxScroll
}

const stopScrollbarDrag = () => {
  scrollbarDrag = null
  revealScrollbar()
  window.removeEventListener('pointermove', handleScrollbarDrag)
  window.removeEventListener('pointerup', stopScrollbarDrag)
}

const startScrollbarDrag = (event) => {
  const scroller = scrollRef.value
  if (!scroller) {
    return
  }

  event.preventDefault()
  scrollbarDrag = {
    startY: event.clientY,
    startScrollTop: scroller.scrollTop,
    trackHeight: scrollbar.trackHeight,
    thumbHeight: scrollbar.thumbHeight,
  }
  scrollbarActive.value = true
  window.addEventListener('pointermove', handleScrollbarDrag)
  window.addEventListener('pointerup', stopScrollbarDrag)
}

const filteredItems = computed(() => filterInsertMenuItems(props.items, query.value))
const groupedItems = computed(() => groupInsertMenuItems(filteredItems.value, INSERT_MENU_GROUPS))

/** 菜单行右侧的 Markdown 快捷提示（与 Notion 一致，按块类型取） */
const shortcutOf = (item) => getBlockShortcut(item?.type)

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

/**
 * 关闭菜单
 *
 * 注意：这里不能接收事件对象做「点在菜单内就跳过」的判断——搜索框的
 * 冒泡事件（Enter / Esc）就是从菜单内部发出的，一旦跳过，Esc 就再也关不掉。
 * 菜单内部的点击过滤放在 handleDocumentMouseDown 里做。
 */
const hide = () => {
  visible.value = false
  showVideoMenu.value = false
  query.value = ''
  insertCallback = null
}

/** 点击菜单外部时关闭；点在菜单 / 视频平台弹层内部不关闭 */
const handleDocumentMouseDown = (event) => {
  if (menuRef.value && menuRef.value.contains(event.target)) {
    return
  }
  if (videoMenuRef.value && videoMenuRef.value.contains(event.target)) {
    return
  }

  hide()
}

/** Esc 关闭后把焦点还给编辑器，否则用户要继续输入还得再点一下正文 */
const closeWithFocus = () => {
  hide()
  props.editor?.commands?.focus?.()
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
    closeWithFocus()
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

/* 打开菜单后重算浮层滑块，并短暂显示一下提示可滚动 */
watch(visible, (opened) => {
  if (!opened) {
    scrollbarActive.value = false
    return
  }
  nextTick(() => {
    updateScrollbar()
    if (scrollbar.visible) {
      revealScrollbar()
    }
  })
})

/* 筛选结果变化后重算滑块高度 */
watch(groupedItems, () => {
  if (visible.value) {
    nextTick(updateScrollbar)
  }
})

onMounted(() => {
  emitter.on('show-insert-menu', handleShowInsertMenu)
  emitter.on('update-insert-menu-query', handleUpdateQuery)
  emitter.on('hide-insert-menu', handleHideMenu)
  emitter.on('show-video-menu', handleShowVideoMenu)
  document.addEventListener('mousedown', handleDocumentMouseDown)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', updateScrollbar)
})

onBeforeUnmount(() => {
  emitter.off('show-insert-menu', handleShowInsertMenu)
  emitter.off('update-insert-menu-query', handleUpdateQuery)
  emitter.off('hide-insert-menu', handleHideMenu)
  emitter.off('show-video-menu', handleShowVideoMenu)
  document.removeEventListener('mousedown', handleDocumentMouseDown)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updateScrollbar)
  window.removeEventListener('pointermove', handleScrollbarDrag)
  window.removeEventListener('pointerup', stopScrollbarDrag)
  if (scrollbarTimer) {
    clearTimeout(scrollbarTimer)
  }
})
</script>

<style scoped>
/* 尺寸、间距、颜色全部来自 Notion 桌面端实测（v7.40）：324 宽 / 40vh 高 /
   10px 圆角 / 32px 行高 / 6px 行圆角 / 首组 4px 后续组 6-4-4 内边距。 */
.sky-insert-menu {
  position: fixed;
  width: var(--sky-insert-menu-width);
  max-height: var(--sky-insert-menu-max-height);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--sky-color-bg);
  border-radius: var(--sky-insert-menu-radius);
  box-shadow: var(--sky-insert-menu-shadow);
  color: var(--sky-insert-menu-text);
  z-index: var(--sky-z-dropdown);
  animation: sky-insert-menu-in 0.15s ease-out;
}

/* 项目全局样式默认 content-box，菜单内统一 border-box，
   避免「宽度 100% + 左右内边距」把搜索框撑出面板右边缘 */
.sky-insert-menu,
.sky-insert-menu * {
  box-sizing: border-box;
}

@keyframes sky-insert-menu-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sky-insert-menu__search {
  flex: 0 0 auto;
  /* 与列表行共用同一条内容列：左右都取分组内边距 4px */
  padding: 8px var(--sky-insert-menu-section-padding) 0 var(--sky-insert-menu-section-padding);
}

.sky-insert-menu__search-input {
  width: 100%;
  height: var(--sky-insert-menu-item-height);
  padding: 0 var(--sky-insert-menu-item-padding);
  border: none;
  border-radius: var(--sky-insert-menu-item-radius);
  background: var(--sky-insert-menu-hover-bg);
  color: var(--sky-insert-menu-text);
  font-family: inherit;
  font-size: var(--sky-font-size-sm);
  line-height: 1.2;
  outline: none;
}

.sky-insert-menu__search-input::placeholder {
  color: var(--sky-insert-menu-shortcut-color);
}

.sky-insert-menu__search-input:focus {
  background: var(--sky-insert-menu-hover-bg-strong);
}

/* 只有列表滚动，搜索框与底部「关闭菜单」保持固定 */
.sky-insert-menu__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* 原生滚动条隐藏，改用下面的内部浮层滑块，避免右侧多出一条占位槽 */
  scrollbar-width: none;
}

.sky-insert-menu__scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 4px 浮层滑块：贴在面板右侧内边距里，不占行宽；悬停菜单或滚动时淡入 */
.sky-insert-menu__scrollbar {
  position: absolute;
  right: var(--sky-insert-menu-scrollbar-inset);
  width: var(--sky-insert-menu-scrollbar-width);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--sky-transition-fast);
}

.sky-insert-menu:hover .sky-insert-menu__scrollbar,
.sky-insert-menu__scrollbar--active {
  opacity: 1;
}

.sky-insert-menu__scrollbar-thumb {
  position: absolute;
  left: 0;
  width: 100%;
  border-radius: var(--sky-radius-full);
  background: var(--sky-insert-menu-scrollbar-thumb);
  pointer-events: auto;
}

/* 4px 视觉宽度，左右各放宽 4px 命中区，方便拖拽 */
.sky-insert-menu__scrollbar-thumb::before {
  content: '';
  position: absolute;
  inset: 0 -4px;
}

.sky-insert-menu__scrollbar-thumb:hover {
  background: var(--sky-insert-menu-scrollbar-thumb-hover);
}

.sky-insert-menu__list {
  display: flex;
  flex-direction: column;
}

.sky-insert-menu__section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: var(--sky-insert-menu-section-padding);
}

/* 分组之间的 1px 分隔线，左右各缩进 12px（4 组内边距 + 8 行内边距） */
.sky-insert-menu__section + .sky-insert-menu__section {
  margin-top: var(--sky-insert-menu-section-gap);
  padding: 6px var(--sky-insert-menu-section-padding) var(--sky-insert-menu-section-padding);
}

.sky-insert-menu__section + .sky-insert-menu__section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 1px;
  background: var(--sky-insert-menu-divider);
}

.sky-insert-menu__title {
  height: 14px;
  margin: 6px 0 8px;
  padding: 0 var(--sky-insert-menu-item-padding);
  overflow: hidden;
  color: var(--sky-insert-menu-label-color);
  font-size: var(--sky-font-size-xs);
  font-weight: 500;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sky-insert-menu__item {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--sky-insert-menu-icon-gap);
  width: 100%;
  height: var(--sky-insert-menu-item-height);
  padding: 0 var(--sky-insert-menu-item-padding);
  border: none;
  border-radius: var(--sky-insert-menu-item-radius);
  background: transparent;
  color: var(--sky-insert-menu-text);
  font-family: inherit;
  font-size: var(--sky-font-size-sm);
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
  transition: background var(--sky-transition-fast);
}

.sky-insert-menu__item:hover:not(:disabled) {
  background-color: var(--sky-insert-menu-hover-bg);
}

.sky-insert-menu__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sky-insert-menu__item--active {
  background-color: var(--sky-insert-menu-hover-bg);
}

.sky-insert-menu__icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--sky-insert-menu-icon-size);
  height: var(--sky-insert-menu-icon-size);
  color: var(--sky-insert-menu-icon-color);
}

.sky-insert-menu__icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.sky-insert-menu__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sky-insert-menu__shortcut {
  flex: 0 0 auto;
  padding-right: 2px;
  color: var(--sky-insert-menu-shortcut-color);
  font-size: var(--sky-font-size-xs);
  line-height: 1.4;
}

.sky-insert-menu__footer {
  flex: 0 0 auto;
  /* 与列表、搜索框共用同一条内容列 */
  padding: 5px var(--sky-insert-menu-section-padding) var(--sky-insert-menu-section-padding)
    var(--sky-insert-menu-section-padding);
  border-top: 1px solid var(--sky-insert-menu-divider);
}

.sky-insert-menu__empty {
  padding: 20px var(--sky-insert-menu-item-padding);
  color: var(--sky-insert-menu-label-color);
  font-size: var(--sky-font-size-sm);
  text-align: center;
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
