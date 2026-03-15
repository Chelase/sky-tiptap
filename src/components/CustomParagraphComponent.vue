<!-- components/CustomParagraphComponent.vue -->
<template>
  <NodeViewWrapper
      class="custom-paragraph"
      @mouseenter="showButton = true"
      @mouseleave="handleMouseLeave"
  >
    <button
        v-show="showButton"
        class="add-button"
        @click.stop="showMenu"
        v-html="icons.plus"
    ></button>
    <div ref="contentRef" class="content-wrapper">
      <NodeViewContent as="p"/>
    </div>
  </NodeViewWrapper>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, watch} from 'vue'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { emitter } from "../utils/emitter";
import { icons } from '../icons'

const props = defineProps({
  editor: Object,
  node: Object,
  decorations: Array,
  selected: Boolean,
  extension: Object,
  getPos: Function,
  updateAttributes: Function,
  deleteNode: Function,
})

const contentRef = ref()
const showButton = ref(false) // 控制按钮显示状态

const isDOMElement = (el) => {
  return el instanceof HTMLElement || el instanceof Element
}

const handleMouseLeave = () => {
  if (!checkCursorPosition()) {
    showButton.value = false
  }
}

// 隐藏按钮的方法
const hideButton = () => {
  if (!checkCursorPosition()) {
    showButton.value = false
  }
}

// 检查段落是否包含光标
const checkCursorPosition = () => {
  if (!props.editor || !props.editor.state || typeof props.getPos !== 'function') return false;

  const { selection } = props.editor.state;
  const start = props.getPos();
  const end = start + props.node.nodeSize;

  // 考虑到光标可能刚好在段落的开始或结束位置
  const isCursorInside = selection.from >= start && selection.to <= end;
  const isCursorAtStart = selection.from === start;
  const isCursorAtEnd = selection.to === end;

  // Also check if the node itself is selected
  const isNodeSelected = props.selected;

  return isCursorInside || isCursorAtStart || isCursorAtEnd || isNodeSelected;
}

const showMenu = (e) => {
  e.stopPropagation()
  if (!contentRef.value || !isDOMElement(contentRef.value)) {
    console.warn('DOM reference not ready')
    return
  }

  const paragraphElement = contentRef.value.querySelector('p')
  if (!paragraphElement) return

  const rect = paragraphElement.getBoundingClientRect()

  emitter.emit('show-insert-menu', {
    position: {
      top: rect.top + window.scrollY + 16,
      left: rect.left + window.scrollX - 40
    },
    insert: (type) => handleInsert(type)
  })
}

const handleInsert = (type) => {
  const pos = props.getPos() + props.node.nodeSize

  switch (type) {
    case 'image':
      emitter.emit('trigger-add-image')
      break
    case 'video':
      emitter.emit('trigger-add-video')
      break
    case 'codeBlock':
      props.editor.chain()
          .focus()
          .insertContentAt(pos, {
            type: 'codeBlock',
            content: [{type: 'text', text: ''}]
          })
          .run()
      break
    case 'embeddedWebSite':
      emitter.emit('trigger-add-website')
      break
    case 'AI':
      emitter.emit('AI-generated')
      break
  }
}

// 监听编辑器选择变化
watch(() => props.editor?.state?.selection, () => {
  // Add a small delay to allow DOM/focus to update
  setTimeout(() => {
    if (props.editor?.isFocused && checkCursorPosition()) {
      showButton.value = true
    } else {
      showButton.value = false
    }
  }, 10)
}, { deep: true })

onMounted(() => {
  // 监听全局隐藏按钮事件
  emitter.on('hide-all-paragraph-buttons', hideButton)
})

onBeforeUnmount(() => {
  // 移除事件监听
  emitter.off('hide-all-paragraph-buttons', hideButton)
})
</script>

<style>
.custom-paragraph {
  position: relative;
  cursor: text;
  /* Ensure paragraph has some min-height so button has room to position */
  min-height: 24px;
}

.add-button {
  position: absolute;
  left: -32px;
  top: 3px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 1; /* 始终显示 */
  transition: all 0.2s;
  z-index: 10; /* 确保按钮在内容上方 */
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  color: #9ca3af; /* muted text color */
  padding: 4px;
  border-radius: 4px;
}

.add-button:hover {
  color: #1f2937; /* text color */
  background-color: #f3f4f6; /* bg-tertiary */
}

.add-button svg {
  width: 100%;
  height: 100%;
}

/* 移除悬停效果 */
/* .custom-paragraph:hover .add-button {
  opacity: 1;
} */
</style>
