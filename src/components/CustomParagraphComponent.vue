<!-- components/CustomParagraphComponent.vue -->
<template>
  <NodeViewWrapper class="custom-paragraph">
    <button
        class="add-button"
        @click.stop="showMenu"
    >+
    </button>
    <div ref="contentRef" class="content-wrapper">
      <NodeViewContent as="p"/>
    </div>
  </NodeViewWrapper>
</template>

<script setup>
import {inject, ref, onMounted} from 'vue'
import {NodeViewWrapper, NodeViewContent} from '@tiptap/vue-3'
import {emitter} from "../utils/emitter";


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

const isDOMElement = (el) => {
  return el instanceof HTMLElement || el instanceof Element
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
      // 保留原有代码块逻辑
      props.editor.chain()
          .focus()
          .insertContentAt(pos, {
            type: 'codeBlock',
            content: [{type: 'text', text: ''}]
          })
          .run()
      break
  }
}

onMounted(() => {
  console.log('Component mounted with ref:', contentRef.value)
})
</script>

<style>
.custom-paragraph {
  position: relative;
  padding-left: 28px;
}

.add-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: #eee;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-paragraph:hover .add-button {
  opacity: 1;
}
</style>