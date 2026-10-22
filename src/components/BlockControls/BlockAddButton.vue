<!-- components/BlockControls/BlockAddButton.vue - 块级「+」按钮 -->
<template>
  <button
    v-show="visible"
    class="sky-block-add-button"
    type="button"
    aria-label="添加区块"
    title="添加区块"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    @mousedown.prevent.stop
    @click.stop="handleClick"
    @mouseleave="handleControlMouseLeave"
  >
    <svg v-html="icons.plus" class="sky-block-add-button__icon"></svg>
  </button>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { emitter } from '../../utils/emitter'
import { icons } from '../../icons'
import { insertBlock } from '../../utils/block-insert'
import { findTopLevelBlock } from '../../utils/block-controls'
import { locateBlockControls, isPointInBlockBand } from '../../utils/block-gutter'
import { getBlockCapabilities } from '../../config/block-capabilities'

/**
 * 块控件（+ 号、拖拽手柄、tippy 弹层）都不在 ProseMirror 的 DOM 内部。
 * 指针移向它们时会触发编辑器的 mouseleave，此时必须保持「+」号可见，
 * 否则用户永远点不到。
 */
const CONTROL_SELECTOR = '.sky-block-add-button, .sky-drag-handle-wrapper, .sky-drag-handle, .tippy-box'

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
  /** 是否启用块级「+」按钮 */
  enabled: {
    type: Boolean,
    default: true,
  },
  /** 块能力覆盖配置，形如 { tableRow: { showHoverMenu: false } } */
  capabilities: {
    type: Object,
    default: () => ({}),
  },
})

const visible = ref(false)
const position = ref({ top: 0, left: 0 })
const menuPosition = ref({ top: 0, left: 0 })
const activeBlock = ref(null)

let dom = null
let frame = null
let pendingCoords = null

const updateFromCoords = (coords) => {
  const view = props.editor?.view
  if (!view) {
    return
  }

  const info = findTopLevelBlock(view, coords)
  if (!info) {
    hide()
    return
  }

  // 依据块能力决定是否显示悬浮菜单
  const capability = getBlockCapabilities(info.node?.type?.name, props.capabilities)
  if (!capability.showHoverMenu) {
    hide()
    return
  }

  const controls = locateBlockControls(view, info)
  if (!controls) {
    hide()
    return
  }

  // 指针在块间空隙里时保持当前块，与官方 DragHandle 的行为对齐
  if (!isPointInBlockBand(controls.rect, coords) && activeBlock.value) {
    return
  }

  activeBlock.value = info
  position.value = controls.add
  menuPosition.value = controls.menu
  visible.value = props.enabled
}

const handleMouseMove = (event) => {
  if (!props.enabled) {
    hide()
    return
  }

  pendingCoords = { left: event.clientX, top: event.clientY }

  if (frame) {
    return
  }

  frame = requestAnimationFrame(() => {
    frame = null
    if (pendingCoords) {
      updateFromCoords(pendingCoords)
    }
  })
}

const hide = () => {
  visible.value = false
  activeBlock.value = null
}

/** 指针是否正移向块控件（而不是真正离开编辑器） */
const isPointerInControl = (target) => {
  if (!target || typeof target.closest !== 'function') {
    return false
  }

  return Boolean(target.closest(CONTROL_SELECTOR))
}

const handleMouseLeave = (event) => {
  if (isPointerInControl(event.relatedTarget)) {
    return
  }

  hide()
}

/**
 * 「+」号自己也会接管指针：此时编辑区收不到 mousemove/mouseleave。
 * 从「+」号回到正文或移到拖拽手柄时保持可见，移向别处才隐藏。
 */
const handleControlMouseLeave = (event) => {
  const related = event.relatedTarget

  if (related && dom?.contains(related)) {
    return
  }

  if (isPointerInControl(related)) {
    return
  }

  hide()
}

const handleClick = (event) => {
  const info = activeBlock.value
  if (!info) {
    return
  }

  // Alt/Option + 点击：直接在上方插入一个空块
  if (event.altKey) {
    insertBlock(props.editor, 'text', { insertAt: info.pos })
    return
  }

  emitter.emit('show-insert-menu', {
    position: {
      top: menuPosition.value.top,
      left: menuPosition.value.left,
    },
    insert: (type) => {
      insertBlock(props.editor, type, { insertAt: info.end })
    },
  })
}

const attach = () => {
  const nextDom = props.editor?.view?.dom
  if (!nextDom || nextDom === dom) {
    return
  }

  detach()
  dom = nextDom
  dom.addEventListener('mousemove', handleMouseMove)
  dom.addEventListener('mouseleave', handleMouseLeave)
}

const detach = () => {
  if (dom) {
    dom.removeEventListener('mousemove', handleMouseMove)
    dom.removeEventListener('mouseleave', handleMouseLeave)
  }

  dom = null

  if (frame && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame)
  }
  frame = null
}

watch(() => props.editor?.view?.dom, attach, { immediate: true })
watch(() => props.enabled, (enabled) => {
  if (!enabled) {
    hide()
  }
})

onMounted(() => {
  attach()
  window.addEventListener('scroll', hide, true)
})

onBeforeUnmount(() => {
  detach()
  window.removeEventListener('scroll', hide, true)
})
</script>

<style scoped>
.sky-block-add-button {
  position: fixed;
  z-index: var(--sky-z-dropdown);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sky-block-control-size);
  height: var(--sky-block-control-size);
  padding: 4px;
  border: none;
  border-radius: var(--sky-radius-sm);
  background: transparent;
  color: var(--sky-color-text-secondary);
  cursor: pointer;
  user-select: none;
  transition: background var(--sky-transition-fast), color var(--sky-transition-fast);
}

.sky-block-add-button:hover {
  background: var(--sky-color-bg-tertiary);
  color: var(--sky-color-text);
}

.sky-block-add-button__icon {
  width: 100%;
  height: 100%;
}
</style>
