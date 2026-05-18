# AI API

## AI 内容生成

通过 `aiConfig` prop 配置 AI 接口：

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const content = ref('')
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  stream: true,
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    :ai-config="aiConfig"
  />
</template>
```

## 配置项

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

## 自定义请求体

默认情况下，请求体会发送 `{ prompt }`。如果 AI 接口需要不同的格式，使用 `buildBody` 自定义：

```javascript
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  buildBody: (prompt) => ({
    model: 'custom-model',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  }),
}
```

## 完全自定义请求

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

## 接口格式

默认请求格式：

```json
{
  "prompt": "用户输入的提示词"
}
```

响应格式（非流式）：

```json
{
  "content": "生成的内容"
}
```

响应格式（流式 SSE）：

```text
data: {"delta": "部分", "content": ""}
data: {"delta": "内容", "content": "部分内容"}
```

## 自定义响应解析

如果接口返回格式与默认格式不同，使用 `parseResponse` 自定义解析：

```javascript
const aiConfig = {
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  parseResponse: (text, response) => {
    const data = JSON.parse(text)
    return data.choices[0].message.content
  },
}
```

## AI 操控编辑器

`aiConfig.mode = 'actions'` 时，编辑器会优先从用户输入中做本地意图解析。明确命令可以不调用 AI 直接执行；本地解析失败时，才会调用 AI，并把 AI 返回文本继续解析为候选 actions。该模式不会执行 AI 返回的 JavaScript，也不会模拟 DOM 点击。

`aiConfig.mode = 'auto'` 时，编辑器同样优先解析并执行受控 actions；如果用户输入和 AI 返回都无法解析出动作，则把 AI 返回内容按 Markdown 插入。

从 `1.7.0` 开始，actions 执行链支持项目侧确认与回滚，不需要依赖 AI 自己说明将要做什么。

### 配置示例

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const content = ref('')
const aiConfig = {
  mode: 'actions',
  previewActions: true,
  rollbackOnActionFailure: true,
  baseUrl: 'https://your-ai-api.com/actions',
  apiKey: 'your-api-key',
  buildBody: (prompt) => ({
    prompt,
    stream: false,
  }),
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    :ai-config="aiConfig"
  />
</template>
```

### 执行控制配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `previewActions` | `boolean` | `false` | 执行前展示项目解析出的受控操作，用户确认后才执行 |
| `executeActions` | `boolean` | `true` | 设置为 `false` 时只展示预览，不执行编辑器命令 |
| `rollbackOnActionFailure` | `boolean` | `true` | action 组执行失败时恢复执行前内容 |
| `showActionResult` | `boolean` | `false` | 执行成功后展示操作结果摘要 |

只调试解析结果、不改动编辑器内容时，可以这样配置：

```javascript
const aiConfig = {
  mode: 'actions',
  previewActions: true,
  executeActions: false,
}
```

### 返回格式

```json
{
  "mode": "actions",
  "actions": [
    {
      "type": "setHeading",
      "params": {
        "level": 2,
        "text": "项目计划"
      }
    },
    {
      "type": "insertTable",
      "params": {
        "rows": 3,
        "cols": 4,
        "withHeaderRow": true
      }
    }
  ]
}
```

### 本地优先解析示例

下面的用户输入会直接解析为 `insertDouyinVideo` 并执行，不依赖 AI 返回 JSON：

```text
插入抖音视频：https://www.douyin.com/video/7633060374058167217
```

下面的用户输入缺少地址，会打开项目内置的抖音视频输入弹窗：

```text
插入抖音视频
```

### 支持的 actions

| Action | 参数 | 说明 |
|--------|------|------|
| `insertMarkdown` | `{ markdown }` | 将 Markdown 渲染为 HTML 后插入 |
| `setHeading` | `{ level, text }` | 插入 H1-H3 标题 |
| `insertTable` | `{ rows, cols, withHeaderRow? }` | 插入表格，最多 20 行、10 列 |
| `insertCodeBlock` | `{ language?, code? }` | 插入代码块文本 |
| `toggleBulletList` | 无 | 切换无序列表 |
| `toggleOrderedList` | 无 | 切换有序列表 |
| `setLink` | `{ href, text? }` | 给当前选区设置链接，或插入带链接文本 |
| `unsetLink` | 无 | 移除当前链接 |
| `insertDivider` | 无 | 插入分割线 |
| `insertImage` | `{ src, alt? }` | 插入图片 URL |
| `insertUploadedVideo` | `{ src }` | 插入已上传的视频 URL |
| `insertBilibiliVideo` | `{ src }` | 插入 Bilibili 视频链接或 BV 号 |
| `insertYoutubeVideo` | `{ src }` | 插入 YouTube 链接或视频 ID |
| `insertDouyinVideo` | `{ src }` | 插入抖音链接或视频 ID |
| `insertIframe` | `{ src }` | 嵌入网页 iframe |
| `requestImageUpload` | 无 | 触发现有图片文件选择入口 |
| `requestVideoUpload` | 无 | 触发现有视频文件选择入口 |

### 二次输入与上传策略

需要地址的 action 必须在 JSON 参数中提供地址，例如 `insertYoutubeVideo` 的 `src`、`insertIframe` 的 `src`、`setLink` 的 `href`。图片 URL、已上传视频 URL、iframe URL 和链接 URL 只接受 `http:` / `https:` 协议。

本地上传不由 AI 读取文件。`requestImageUpload` 和 `requestVideoUpload` 只会触发现有文件选择入口，用户选择文件后仍通过 `uploadPhoto` / `uploadVideo` 事件交给业务侧上传，上传完成后业务侧再调用 `insertImage` / `insertImages` 或 `insertVideo` / `insertVideos`。
