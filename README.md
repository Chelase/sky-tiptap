# sky-tiptap

**这是一款适用于 Vue3 的 Tiptap 富文本编辑器组件，开箱即用、功能丰富。**

---

### 安装

```bash
npm install @Chelase/sky-tiptap
```

如果你使用 GitHub Actions 同步发布到 npm 的公共包版本，请将安装和 import 路径替换为 `sky-tiptap`。以下示例默认以仓库源码包名 `@Chelase/sky-tiptap` 为例。

---

### 基础使用

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()
const content = ref('')
</script>

<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
  />
</template>
```

---

### 上传图片

sky-tiptap 不内置 HTTP 上传接口。点击插入图片后，组件会把选择的图片文件交给外部业务代码；业务侧完成上传并拿到图片 URL 后，再调用 **insertImage** 或 **insertImages** 插入编辑器。

图片选择支持单图和多图，统一使用 `uploadPhoto` 事件。事件参数始终是 `File[]`，单图时数组长度为 1。

```vue
<template>
  <div>
    <sky-tiptap
      ref="editor"
      v-model="content"
      @uploadPhoto="handleUploadPhoto"
    />
  </div>
</template>

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
```

---

### 手动获取富文本内容

```vue
<script setup>
import { SkyTiptap, getContent } from '@Chelase/sky-tiptap'

const getValue = () => {
  const value = getContent()
  console.log(value)
}
</script>
```

### 统一弹窗交互

视频链接插入、链接地址设置、网页 iframe 嵌入和错误提示统一使用内置弹窗，不再调用浏览器原生 `prompt` / `alert`。弹窗会自动处理输入聚焦、键盘 Esc 关闭、空值校验和错误提示，视觉风格与编辑器现有设计变量保持一致。

### AI 生成

AI 生成功能只负责调用外部配置的接口，不内置具体模型服务。点击 AI 生成后会弹出提示词输入框，组件默认用 `POST baseUrl` 发起请求，请求头携带 `Authorization: Bearer apiKey`，默认请求体为 `{ "prompt": "用户输入的提示词" }`。接口返回内容会按 Markdown 渲染为 HTML 后插入到当前光标位置。

```vue
<template>
  <sky-tiptap
    v-model="content"
    :ai-config="{
      baseUrl: 'https://api.example.com/ai/generate',
      apiKey: 'your-api-key'
    }"
  />
</template>
```

如果接口需要使用弹窗输入内容，推荐通过 `buildBody(prompt)` 由使用方自行组装请求体。组件不会定义或猜测接口内容格式，只会把 `buildBody` 返回的对象原样发送给 `baseUrl`：

```vue
<template>
  <sky-tiptap
    v-model="content"
    :ai-config="{
      baseUrl: 'https://www.right.codes/codex/v1/responses',
      apiKey: 'your-api-key',
      buildBody: (prompt) => ({
        model: 'gpt-5.2',
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt
              }
            ]
          }
        ],
        stream: true
      })
    }"
  />
</template>
```

如果请求体是固定内容，不需要使用弹窗输入，可以传 `requestBody`，组件会原样 `JSON.stringify` 后发送，不会替换任何字段：

```javascript
const aiConfig = {
  baseUrl: 'https://api.example.com/ai',
  apiKey: 'your-api-key',
  requestBody: {
    model: 'custom-model',
    input: 'fixed input'
  }
}
```

更复杂的接口可以用 `buildRequest` 完全接管请求配置：

```javascript
const aiConfig = {
  baseUrl: 'https://api.example.com/ai',
  apiKey: 'your-api-key',
  buildRequest: ({ prompt, baseUrl, apiKey }) => ({
    url: baseUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ prompt })
  })
}
```

接口返回支持纯文本，也兼容常见 JSON 字段：`content`、`text`、`message`、`result`、`data.content`、`data.text`、`choices[0].message.content`、`choices[0].text`。如果请求体或配置中声明了 `stream: true`，组件会读取 SSE `data:` 流，持续累计 Markdown 并用 `markdown-it` 渲染后更新同一段生成内容。如果接口未返回可插入内容，弹窗会显示错误提示并停止插入。

### 上传视频

除 Bilibili、YouTube、抖音链接嵌入外，也可以上传本地视频文件。sky-tiptap 不内置视频上传接口，组件会通过 `uploadVideo` 返回选择的视频文件数组；业务侧上传完成后调用 **insertVideo** 或 **insertVideos** 插入视频 URL。

```vue
<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
    @uploadVideo="handleUploadVideo"
  />
</template>

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
```

---

### 功能清单

#### 基础编辑
- ✅ 粗体、斜体、下划线、删除线
- ✅ 标题（H1、H2、H3）
- ✅ 无序列表、有序列表
- ✅ 撤销/重做
- ✅ 代码块（支持语法高亮）

#### 格式转换（Markdown 输入）
- `## ` + 空格 → 标题
- `**文字**` → 加粗
- `` `代码` `` → 行内代码
- `- ` 或 `* ` → 无序列表
- `1. ` → 有序列表
- `> ` → 引用块
- `---` → 分割线

#### 插入功能
- ✅ 图片上传
- ✅ Bilibili 视频嵌入
- ✅ YouTube 视频嵌入
- ✅ 抖音/TikTok 视频嵌入
- ✅ 网页 iframe 嵌入
- ✅ 表格插入
- ✅ 链接添加（Ctrl+点击在新标签页打开）
- ✅ 统一弹窗交互（视频、链接、嵌入网站、错误提示）

#### 其他
- ✅ AI 内容生成（集成 Sky-AI 流式响应）
- ✅ AI 流式 Markdown 渲染
- ✅ 悬浮菜单（Bubble Menu，含标题与列表）
- ✅ 插入菜单（Insert Menu）
- ✅ 工具栏（Toolbar）

---

### API 参考

#### 组件 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | String | `''` | 双向绑定的内容 |
| `theme` | String | `'default'` | 主题（default/dark） |
| `showToolbar` | Boolean | `false` | 是否显示工具栏 |
| `placeholder` | String | `'输入内容...'` | 占位符 |
| `aiConfig` | Object | `{ baseUrl: '', apiKey: '' }` | AI 生成接口配置，支持原样传递 `requestBody`、用 `buildBody` 组装弹窗输入、用 `buildRequest` 完全接管请求，以及 `headers`、`method`、`parseResponse` |

#### 组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | String | 内容变化时触发 |
| `uploadPhoto` | File[] | 选择图片时触发，支持单图和多图 |
| `uploadVideo` | File[] | 选择视频时触发，支持单视频和多视频 |

#### 导出工具函数

```javascript
import { insertImage, insertImages, insertVideo, insertVideos, getContent } from '@Chelase/sky-tiptap'

// 插入图片
insertImage('https://example.com/image.png')

// 批量插入图片
insertImages([
  'https://example.com/one.png',
  'https://example.com/two.png'
])

// 插入视频
insertVideo('https://example.com/video.mp4')

// 批量插入视频
insertVideos([
  'https://example.com/one.mp4',
  'https://example.com/two.mp4'
])

// 获取编辑器内容
const html = getContent()
```

---

### 技术栈

- **Vue 3** - 前端框架
- **Tiptap 2.x** - 富文本编辑器核心
- **Vite 6.x** - 构建工具
- **lowlight** - 代码语法高亮
- **highlight.js** - 高亮主题

---

### 版本

当前版本：**1.3.0**

详细更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)
