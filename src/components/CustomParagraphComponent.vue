<!-- components/CustomParagraphComponent.vue -->
<template>
  <NodeViewWrapper
      class="custom-paragraph"
      @click.stop="handleParagraphClick"
  >
    <button
        v-if="showButton"
        class="add-button"
        @click.stop="showMenu"
    >+</button>
    <div ref="contentRef" class="content-wrapper">
      <NodeViewContent as="p"/>
    </div>
  </NodeViewWrapper>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, watch} from 'vue'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { emitter } from "../utils/emitter";

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
const isActive = ref(false) // 跟踪段落是否激活

const isDOMElement = (el) => {
  return el instanceof HTMLElement || el instanceof Element
}

// 点击段落显示按钮
const handleParagraphClick = (e) => {
  e.stopPropagation()
  // 隐藏其他段落的按钮
  emitter.emit('hide-all-paragraph-buttons')
  // 显示当前段落的按钮
  showButton.value = true
}

// 隐藏按钮的方法
const hideButton = () => {
  showButton.value = false
}

// 检查段落是否包含光标
const checkCursorPosition = () => {
  if (!props.editor || !props.editor.state) return false;

  const { selection } = props.editor.state;
  const start = props.getPos();
  const end = start + props.node.nodeSize;

  return selection.from >= start && selection.to <= end;
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
  }
}

// 监听编辑器选择变化
watch(() => props.editor?.state?.selection, () => {
  if (props.editor?.isFocused && checkCursorPosition()) {
    // 隐藏其他段落的按钮
    emitter.emit('hide-all-paragraph-buttons')
    showButton.value = true
    isActive.value = true
  } else if (!isActive.value) {
    showButton.value = false
  }
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
}

.add-button {
  position: absolute;
  left: -2%;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: #eee;
  border-radius: 4px;
  cursor: pointer;
  opacity: 1; /* 始终显示 */
  transition: opacity 0.2s;
  z-index: 10; /* 确保按钮在内容上方 */
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

/* 移除悬停效果 */
/* .custom-paragraph:hover .add-button {
  opacity: 1;
} */
</style>
