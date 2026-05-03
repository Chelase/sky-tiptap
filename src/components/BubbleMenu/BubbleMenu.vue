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
      :onClick="() => editor.chain().focus().toggleHeading({ level: 1 }).run()"
      :isActive="editor.isActive('heading', { level: 1 })"
      tooltip="一级标题"
    >
      H1
    </ToolbarButton>
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleHeading({ level: 2 }).run()"
      :isActive="editor.isActive('heading', { level: 2 })"
      tooltip="二级标题"
    >
      H2
    </ToolbarButton>
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleHeading({ level: 3 }).run()"
      :isActive="editor.isActive('heading', { level: 3 })"
      tooltip="三级标题"
    >
      H3
    </ToolbarButton>
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleBulletList().run()"
      :isActive="editor.isActive('bulletList')"
      tooltip="无序列表"
      :iconSvg="icons.bulletList"
    />
    <ToolbarButton
      :onClick="() => editor.chain().focus().toggleOrderedList().run()"
      :isActive="editor.isActive('orderedList')"
      tooltip="有序列表"
      :iconSvg="icons.orderedList"
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
import { emitter } from '../../utils/emitter'
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

  emitter.emit('open-dialog', {
    mode: 'input',
    title: '设置链接',
    description: '输入要绑定到当前选中文本的链接地址。清空内容可移除链接。',
    inputLabel: '链接地址',
    placeholder: 'https://example.com',
    defaultValue: previousUrl || '',
    confirmText: '应用',
    onConfirm: (url) => {
      if (url === '') {
        props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
  })
}
</script>

<style scoped>
@import '../../styles/variables.css';

.sky-bubble-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background-color: var(--sky-color-bg);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.sky-bubble-menu__divider {
  width: 1px;
  height: 20px;
  background-color: var(--sky-color-border);
  margin: 0 4px;
}
</style>
