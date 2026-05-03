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
| `aiConfig` | `Object` | `{ baseUrl: '', apiKey: '' }` | AI 内容生成配置 |

#### aiConfig 配置

```javascript
{
  baseUrl: 'https://your-ai-api.com/generate',  // AI 接口地址
  apiKey: 'your-api-key',                        // API 密钥
  stream: true,                                  // 是否启用流式响应（可选）
}
```

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `String` | 编辑器内容变化时触发 |
| `uploadPhoto` | `File[]` | 用户选择图片时触发，参数为文件数组 |
| `uploadVideo` | `File[]` | 用户选择视频时触发，参数为文件数组 |

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

### 全局编辑器实例

组件会自动挂载 `window.skyTiptapEditor`，可以在任意位置访问：

```javascript
// 获取编辑器实例
const editor = window.skyTiptapEditor

// 获取 HTML
const html = editor.getHTML()

// 获取 JSON 结构
const json = editor.getJSON()

// 获取纯文本
const text = editor.getText()

// 执行命令
editor.chain().focus().toggleBold().run()

// 判断是否有某个标记
const isBold = editor.isActive('bold')
```

---

## 媒体插入

### 插入图片

```javascript
import { insertImage, insertImages } from '@Chelase/sky-tiptap'

// 插入单张图片
insertImage('https://example.com/image.png')

// 批量插入图片
insertImages([
  'https://example.com/one.png',
  'https://example.com/two.png'
])
```

### 图片上传

```vue
<script setup>
import { SkyTiptap, insertImages } from '@Chelase/sky-tiptap'

const handleUploadPhoto = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadPhoto(formData)
      return data[0]
    })
  )

  insertImages(urls)
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    @uploadPhoto="handleUploadPhoto"
  />
</template>
```

### 插入视频

```javascript
import { insertVideo, insertVideos } from '@Chelase/sky-tiptap'

// 插入单个视频
insertVideo('https://example.com/video.mp4')

// 批量插入视频
insertVideos([
  'https://example.com/one.mp4',
  'https://example.com/two.mp4'
])
```

### 视频上传

```vue
<script setup>
import { SkyTiptap, insertVideos } from '@Chelase/sky-tiptap'

const handleUploadVideo = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadVideo(formData)
      return data.url
    })
  )

  insertVideos(urls)
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    @uploadVideo="handleUploadVideo"
  />
</template>
```

---

## AI 内容生成

### 配置

通过 `aiConfig` prop 配置 AI 接口：

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const content = ref('')
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  stream: true,  // 启用流式响应
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    :ai-config="aiConfig"
  />
</template>
```

### 配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `baseUrl` | `string` | AI 接口地址（必填） |
| `apiKey` | `string` | API 密钥（必填） |
| `stream` | `boolean` | 是否启用流式响应，默认 `false` |
| `buildBody` | `(prompt) => object` | 自定义请求体生成函数 |
| `buildRequest` | `(config) => object` | 完全自定义请求配置 |
| `headers` | `object` | 自定义请求头 |
| `requestBody` | `object` | 固定请求体（优先级低于 `buildBody`） |
| `parseResponse` | `(text, response) => string` | 自定义响应解析函数 |

### 自定义请求体

默认情况下，请求体会发送 `{ prompt }`。如果 AI 接口需要不同的格式，使用 `buildBody` 自定义：

```javascript
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  buildBody: (prompt) => ({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  }),
}
```

### 完全自定义请求

如果需要完全控制请求（如添加签名、使用不同认证方式），使用 `buildRequest`：

```javascript
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  buildRequest: async ({ prompt, baseUrl, apiKey }) => {
    return {
      url: baseUrl,
      fetchOptions: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1000,
        }),
      },
    }
  },
}
```

### 接口格式

**默认请求格式：**
```json
{
  "prompt": "用户输入的提示词"
}
```

**响应格式（非流式）：**
```json
{
  "content": "生成的内容"
}
```

**响应格式（流式 SSE）：**
```
data: {"delta": "部分", "content": ""}
data: {"delta": "内容", "content": "部分内容"}
```

### 自定义响应解析

如果接口返回格式与默认格式不同，使用 `parseResponse` 自定义解析：

```javascript
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  parseResponse: (text, response) => {
    const data = JSON.parse(text)
    // 适配不同的响应格式
    return data.choices[0].message.content
  },
}
```

---

## 获取内容

### getContent

```javascript
import { getContent } from '@Chelase/sky-tiptap'

const html = getContent()
console.log(html) // '<p>Hello World</p>'
```

**返回值：** `string` - 编辑器内容的 HTML 字符串

### 在 Vue 组件外使用

由于工具函数内部通过事件总线通信，可以在 Vue 组件外部使用：

```javascript
import { insertImage, getContent } from '@Chelase/sky-tiptap'

// 在任意 JS 文件中
function addCoverImage(url) {
  insertImage(url)
}

function saveContent() {
  const html = getContent()
  // 保存到服务器...
}
```