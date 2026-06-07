# 事件

## 事件列表

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `String` | 编辑器内容变化时触发 |
| `uploadPhoto` | `File[]` | 用户选择图片时触发，参数为文件数组 |
| `uploadVideo` | `File[]` | 用户选择视频时触发，参数为文件数组 |
| `paste` | `Object` | 用户粘贴内容时触发，可拦截图片等文件粘贴 |
| `drop` | `Object` | 用户拖放文件到编辑器时触发 |
| `ready` | - | 编辑器初始化完成时触发 |
| `focus` | - | 编辑器获得焦点时触发 |
| `blur` | - | 编辑器失去焦点时触发 |
| `selectionChange` | `Object` | 编辑器选区变化时触发，包含 `from`、`to`、`text`、`empty` |
| `linkClick` | `Object` | 点击编辑器内链接时触发，可拦截默认跳转行为 |

## paste 事件

`paste` 事件用于拦截编辑器粘贴行为，尤其适合处理剪贴板图片。

如果没有监听 `paste`，或监听后没有调用 `pasteEvent.preventDefault()`，编辑器会继续执行默认粘贴逻辑，剪贴板图片仍可能以 base64 形式进入内容。

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editorRef = ref()
const content = ref('')

const handlePaste = async (pasteEvent) => {
  if (!pasteEvent.files.length) return

  pasteEvent.preventDefault()

  const urls = await Promise.all(
    pasteEvent.files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadPhoto(formData)
      return data.url
    })
  )

  editorRef.value?.insertImages(urls)
}
</script>

<template>
  <sky-tiptap
    ref="editorRef"
    v-model="content"
    @paste="handlePaste"
  />
</template>
```

### paste 事件对象

| 字段 | 说明 |
|------|------|
| `event` | 原始 `ClipboardEvent` |
| `type` | 粘贴类型：`text`、`html`、`image`、`mixed` |
| `files` | 粘贴中的文件数组 |
| `text` | 剪贴板纯文本内容 |
| `html` | 剪贴板 HTML 内容 |
| `preventDefault()` | 阻止编辑器默认粘贴行为 |
| `handled` | 预留处理状态字段 |

## drop 事件

`drop` 事件用于处理拖放到编辑器中的文件。和 `paste` 一样，只有调用 `dropEvent.preventDefault()` 时才会阻止默认拖放行为。

### drop 事件对象

| 字段 | 说明 |
|------|------|
| `event` | 原始 `DragEvent` |
| `files` | 拖放的文件数组 |
| `type` | 文件类型：`image` 或 `file` |
| `preventDefault()` | 阻止编辑器默认拖放行为 |

## selectionChange 事件

选区变化时触发：

```vue
<sky-tiptap
  v-model="content"
  @selection-change="handleSelectionChange"
/>
```

### selectionChange 事件对象

| 字段 | 说明 |
|------|------|
| `from` | 选区开始位置 |
| `to` | 选区结束位置 |
| `text` | 当前选中的文本 |
| `empty` | 是否为空选区 |

## linkClick 事件

`linkClick` 事件在用户点击编辑器内链接时触发。业务侧可以读取链接地址，做埋点、预览、权限判断或自定义跳转。

如果业务侧没有调用 `linkClickEvent.preventDefault()`，Ctrl 或 Meta + Click 仍会按默认行为在新标签页打开链接。

```vue
<script setup>
const handleLinkClick = (linkClickEvent) => {
  if (!linkClickEvent.href) return

  linkClickEvent.preventDefault()

  // 例如：使用业务侧路由、打开链接预览弹窗或做跳转确认
  window.open(linkClickEvent.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    @link-click="handleLinkClick"
  />
</template>
```

### linkClick 事件对象

| 字段 | 说明 |
|------|------|
| `event` | 原始 `MouseEvent` |
| `target` | 被点击的链接元素 |
| `href` | 链接地址 |
| `pos` | 点击位置 |
| `ctrlKey` | 点击时是否按下 Ctrl |
| `metaKey` | 点击时是否按下 Meta / Command |
| `preventDefault()` | 阻止编辑器默认链接点击行为 |
