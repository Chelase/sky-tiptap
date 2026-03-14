<!-- BubbleMenu.vue - 悬浮菜单组件（选中文字时显示） -->
<template>
  <bubble-menu
    v-if="editor"
    class="sky-bubble-menu"
    :editor="editor"
    :tippy-options="tippyOptions"
  >
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleBold().run()"
      :isActive="editor.isActive('bold')"
      tooltip="加粗"
      :iconSvg="icons.bold"
    />
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleItalic().run()"
      :isActive="editor.isActive('italic')"
      tooltip="斜体"
      :iconSvg="icons.italic"
    />
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleUnderline().run()"
      :isActive="editor.isActive('underline')"
      tooltip="下划线"
      :iconSvg="icons.underline"
    />
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleStrike().run()"
      :isActive="editor.isActive('strike')"
      tooltip="删除线"
      :iconSvg="icons.strike"
    />
    <div class="sky-bubble-menu__divider"></div>
    <ToolbarButton
      :onClick="setLink"
      :isActive="editor.isActive('link')"
      tooltip="链接"
      :iconSvg="icons.link"
    />
  </bubble-menu>
</template>

<script setup>
import { BubbleMenu } from '@tiptap/vue-3'
import { icons } from '../../icons'
import ToolbarButton from '../Toolbar/ToolbarButton.vue'

const props = defineProps({
  editor: {
    type: Object,
    required: true
  }
})

// Tippy.js 配置
const tippyOptions = {
  duration: 150,
  maxWidth: 400,
  appendTo: 'parent',
  zIndex: 100,
}

// 设置链接
const setLink = () => {
  const previousUrl = props.editor.getAttributes('link').href
  const url = window.prompt('输入链接地址', previousUrl)
  
  if (url === null) {
    return
  }
  
  if (url === '') {
    props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  
  props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<style scoped>
@import '../../styles/variables.css';

.sky-bubble-menu {
  display: flex;
  align-items: center;
  gap: var(--sky-spacing-xs);
  padding: var(--sky-spacing-sm);
  background-color: var(--sky-color-bg);
  border-radius: var(--sky-radius-lg);
  box-shadow: var(--sky-shadow-xl);
  border: 1px solid var(--sky-color-border);
}

.sky-bubble-menu__divider {
  width: 1px;
  height: 24px;
  background-color: var(--sky-color-border);
  margin: 0 var(--sky-spacing-xs);
}
</style>
