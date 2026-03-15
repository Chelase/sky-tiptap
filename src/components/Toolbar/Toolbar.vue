<!-- Toolbar.vue - 工具栏组件 -->
<template>
  <div class="sky-toolbar">
    <!-- 历史操作组 -->
    <div class="sky-toolbar-group">
      <ToolbarButton
        :onClick="undo"
        :disabled="!editor?.can().undo()"
        tooltip="撤销"
        :iconSvg="icons.undo"
      />
      <ToolbarButton
        :onClick="redo"
        :disabled="!editor?.can().redo()"
        tooltip="重做"
        :iconSvg="icons.redo"
      />
    </div>
    
    <!-- 格式化组 -->
    <div class="sky-toolbar-group">
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleBold().run()"
        :isActive="editor?.isActive('bold')"
        tooltip="加粗"
        :iconSvg="icons.bold"
      />
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleItalic().run()"
        :isActive="editor?.isActive('italic')"
        tooltip="斜体"
        :iconSvg="icons.italic"
      />
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleUnderline().run()"
        :isActive="editor?.isActive('underline')"
        tooltip="下划线"
        :iconSvg="icons.underline"
      />
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleStrike().run()"
        :isActive="editor?.isActive('strike')"
        tooltip="删除线"
        :iconSvg="icons.strike"
      />
    </div>
    
    <!-- 标题组 -->
    <div class="sky-toolbar-group">
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :isActive="editor?.isActive('heading', { level: 1 })"
        tooltip="一级标题"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :isActive="editor?.isActive('heading', { level: 2 })"
        tooltip="二级标题"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :isActive="editor?.isActive('heading', { level: 3 })"
        tooltip="三级标题"
      >
        H3
      </ToolbarButton>
    </div>
    
    <!-- 列表组 -->
    <div class="sky-toolbar-group">
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleBulletList().run()"
        :isActive="editor?.isActive('bulletList')"
        tooltip="无序列表"
        :iconSvg="icons.bulletList"
      />
      <ToolbarButton
        :onClick="() => editor.chain().focus().toggleOrderedList().run()"
        :isActive="editor?.isActive('orderedList')"
        tooltip="有序列表"
        :iconSvg="icons.orderedList"
      />
    </div>
    
    <!-- 插入组 -->
    <div class="sky-toolbar-group">
      <ToolbarButton
        :onClick="insertImage"
        tooltip="插入图片"
        :iconSvg="icons.image"
      />
      <ToolbarButton
        :onClick="insertVideo"
        tooltip="插入视频"
        :iconSvg="icons.video"
      />
      <ToolbarButton
        :onClick="insertCodeBlock"
        :isActive="editor?.isActive('codeBlock')"
        tooltip="代码块"
        :iconSvg="icons.code"
      />
      <ToolbarButton
        :onClick="insertTable"
        tooltip="表格"
        :iconSvg="icons.table"
      />
      <ToolbarButton
        :onClick="insertDivider"
        tooltip="分割线"
        :iconSvg="icons.divider"
      />
      <ToolbarButton
        :onClick="setLink"
        :isActive="editor?.isActive('link')"
        tooltip="链接"
        :iconSvg="icons.link"
      />
    </div>
    
    <!-- AI 组 -->
    <div class="sky-toolbar-group">
      <ToolbarButton
        :onClick="askAI"
        tooltip="AI 生成"
        :iconSvg="icons.ai"
      />
    </div>
  </div>
</template>

<script setup>
import { icons } from '../../icons'
import ToolbarButton from './ToolbarButton.vue'
import { emitter } from '../../utils/emitter'

const props = defineProps({
  editor: {
    type: Object,
    required: true
  }
})

// 历史操作
const undo = () => {
  props.editor?.chain().focus().undo().run()
}

const redo = () => {
  props.editor?.chain().focus().redo().run()
}

// 插入操作
const insertImage = () => {
  emitter.emit('trigger-add-image')
}

const insertVideo = () => {
  emitter.emit('show-video-menu')
}

const insertCodeBlock = () => {
  props.editor?.chain().focus().toggleCodeBlock().run()
}

const insertTable = () => {
  // TODO: 实现表格插入
  console.log('插入表格')
}

const insertDivider = () => {
  props.editor?.chain().focus().setHorizontalRule().run()
}

const setLink = () => {
  const previousUrl = props.editor?.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)
  
  if (url === null) {
    return
  }
  
  if (url === '') {
    props.editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  
  props.editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const askAI = () => {
  emitter.emit('AI-generated')
}
</script>

<style scoped>
</style>
