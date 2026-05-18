# 实例方法

通过 `ref` 获取组件实例后，可以调用 `SkyTiptap` 暴露的方法。

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editorRef = ref()

onMounted(() => {
  const html = editorRef.value?.getContent()
  console.log(html)
})
</script>

<template>
  <sky-tiptap ref="editorRef" v-model="content" />
</template>
```

## 方法列表

| 方法 | 说明 |
|------|------|
| `insertImage(url)` | 插入单张图片 |
| `insertImages(urls)` | 插入多张图片 |
| `insertVideo(url)` | 插入单个本地视频 URL |
| `insertVideos(urls)` | 插入多个本地视频 URL |
| `insertGeneratedContent(content)` | 插入生成后的 HTML 内容 |
| `getContent()` | 获取当前 HTML |
| `setContent(content)` | 设置编辑器 HTML |

## 兼容全局编辑器实例

组件挂载后会设置 `window.skyTiptapEditor`，供历史兼容工具函数使用。新代码优先使用组件 `ref` 暴露的方法；只有需要兼容旧调用方式时，才直接访问全局实例：

```javascript
const editor = window.skyTiptapEditor

const html = editor.getHTML()

editor.chain().focus().toggleBold().run()
```

## 在 Vue 组件外使用

兼容工具函数内部通过 `window.skyTiptapEditor` 访问当前编辑器实例，可以在 Vue 组件外部使用：

```javascript
import { insertImage, getContent } from '@Chelase/sky-tiptap'

function addCoverImage(url) {
  insertImage(url)
}

function saveContent() {
  const html = getContent()
  // 保存到服务器...
}
```
