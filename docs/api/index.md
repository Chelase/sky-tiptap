# 组件 API

## SkyTiptap

主编辑器组件。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `String` | `''` | 双向绑定的内容，支持 `v-model` |
| `theme` | `String` | `'default'` | 主题，可选值：`default`、`dark` |
| `showToolbar` | `Boolean` | `false` | 是否显示顶部工具栏 |
| `placeholder` | `String` | `'输入内容...'` | 编辑器占位符文本 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `String` | 编辑器内容变化时触发 |
| `uploadPhoto` | `File[]` | 用户选择图片时触发，参数为文件数组 |

### 示例

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const content = ref('')

const handleUpload = (files) => {
  console.log('选择的图片:', files)
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    theme="default"
    :show-toolbar="true"
    placeholder="开始输入..."
    @uploadPhoto="handleUpload"
  />
</template>
```

### 获取编辑器实例

通过 `ref` 获取组件实例后，可以访问 `editor` 属性：

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editorRef = ref()

onMounted(() => {
  // 访问 Tiptap Editor 实例
  const editor = editorRef.value?.editor
  if (editor) {
    // 获取 HTML
    const html = editor.getHTML()
    // 获取 JSON
    const json = editor.getJSON()
    // 获取纯文本
    const text = editor.getText()
  }
})
</script>
```

### 插入图片

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap, insertImage, insertImages } from '@Chelase/sky-tiptap'

const editorRef = ref()

const addImage = () => {
  insertImage('https://example.com/image.png')
}

const addImages = () => {
  insertImages([
    'https://example.com/1.png',
    'https://example.com/2.png'
  ])
}
</script>
```

### 获取内容

```vue
<script setup>
import { SkyTiptap, getContent } from '@Chelase/sky-tiptap'

const getValue = () => {
  const html = getContent()
  console.log(html)
}
</script>
```

### 全局编辑器实例

组件会自动挂载 `window.skyTiptapEditor`，可以在任意位置访问：

```javascript
// 获取编辑器实例
const editor = window.skyTiptapEditor

// 获取内容
const html = editor.getHTML()
```