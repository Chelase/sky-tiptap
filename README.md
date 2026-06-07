# sky-tiptap

**这是一款适用于 Vue3 的 Tiptap 富文本编辑器组件，开箱即用、功能丰富。**

---

### 安装

GitHub Packages 包名：

```bash
npm install @Chelase/sky-tiptap
```

npm 公共包名：

```bash
npm install sky-tiptap
```

如果使用 npm 公共包版本，请将示例中的 import 路径替换为 `sky-tiptap`。以下示例默认以 GitHub Packages 包名 `@Chelase/sky-tiptap` 为例。

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

确认提示词后，弹窗会立即关闭，编辑器会在当前光标位置显示 AI 骨架屏。接口返回支持纯文本，也兼容常见 JSON 字段：`content`、`text`、`message`、`result`、`data.content`、`data.text`、`choices[0].message.content`、`choices[0].text`。如果请求体或配置中声明了 `stream: true`，组件会读取 SSE `data:` 流，持续累计 Markdown 并用 `markdown-it` 渲染后更新同一段生成内容。如果接口请求失败或未返回可插入内容，组件会移除骨架屏并弹出错误提示。

### AI 操控编辑器

从 1.4.0 开始，`aiConfig.mode` 可以设置为 `actions`。从 1.6.0 开始，编辑器会先从用户输入中做本地意图解析，明确命令不再依赖 AI 返回 JSON。AI 只作为补充文本来源；编辑器不会执行 AI 返回的 JavaScript，也不会通过 DOM 点击模拟完成操作。从 1.7.0 开始，受控 actions 支持执行前预览、只预览不执行、失败回滚和可选执行结果摘要。

支持的模式：

| mode | 说明 |
|------|------|
| `content` | 默认模式，AI 返回文本或 Markdown 后插入编辑器 |
| `actions` | 只执行受控编辑器动作；无法识别动作时提示失败 |
| `auto` | 优先执行受控编辑器动作；无法识别动作时把 AI 返回内容作为 Markdown 插入 |

第三阶段执行控制配置：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `previewActions` | `boolean` | `false` | 执行前展示项目解析出的受控操作，用户确认后才执行 |
| `executeActions` | `boolean` | `true` | 设置为 `false` 时只展示操作预览，不真正执行编辑器命令 |
| `rollbackOnActionFailure` | `boolean` | `true` | action 组执行失败时恢复执行前内容 |
| `showActionResult` | `boolean` | `false` | 执行成功后展示操作摘要 |

当前支持的 action：

| Action | 说明 |
|--------|------|
| `insertMarkdown` | 将 Markdown 渲染为 HTML 后插入 |
| `setHeading` | 插入 H1-H3 标题 |
| `insertTable` | 插入表格，最多 20 行、10 列 |
| `insertCodeBlock` | 插入代码块文本 |
| `toggleBulletList` | 切换无序列表 |
| `toggleOrderedList` | 切换有序列表 |
| `setLink` | 给当前选区设置链接，或插入带链接文本 |
| `unsetLink` | 移除当前链接 |
| `insertDivider` | 插入分割线 |
| `insertImage` | 插入图片 URL |
| `insertUploadedVideo` | 插入已上传的视频 URL |
| `insertBilibiliVideo` | 插入 Bilibili 视频 |
| `insertYoutubeVideo` | 插入 YouTube 视频 |
| `insertDouyinVideo` | 插入抖音视频 |
| `insertIframe` | 嵌入网页 iframe |
| `requestImageUpload` | 触发现有图片文件选择入口 |
| `requestVideoUpload` | 触发现有视频文件选择入口 |

```vue
<template>
  <sky-tiptap
    v-model="content"
    :ai-config="{
      mode: 'actions',
      previewActions: true,
      rollbackOnActionFailure: true,
      baseUrl: 'https://api.example.com/ai/actions',
      apiKey: 'your-api-key',
      buildBody: (prompt) => ({
        prompt,
        stream: false
      })
    }"
  />
</template>
```

明确命令会优先由项目本地解析。例如下面的输入会直接插入抖音视频，不需要 AI 返回 JSON：

```text
插入抖音视频：https://www.douyin.com/video/7633060374058167217
```

如果用户输入缺少必要参数，例如：

```text
插入抖音视频
```

项目会打开现有抖音视频链接输入弹窗，让用户补充地址。

需要地址的 action 应由 AI 在 JSON 中返回完整参数。例如 Bilibili、YouTube、抖音和 iframe 嵌入需要 `src`，链接需要 `href`。图片 URL、已上传视频 URL、iframe URL、链接 URL 只接受 `http:` / `https:` 地址。本地文件上传不会由 AI 直接读取文件，只能通过 `requestImageUpload` / `requestVideoUpload` 触发现有文件选择入口，后续上传仍由业务侧通过 `uploadPhoto` / `uploadVideo` 事件完成。

接口返回示例：

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

### 元素拖拽排序

编辑器默认接入 Tiptap 官方拖拽能力。存在多个可拖拽顶层区块时，桌面端悬停在段落、标题、图片、视频、iframe、表格、代码块等块级内容左侧会显示拖拽手柄，可拖动调整内容顺序。拖拽时会显示主题色落点指示线。

拖拽能力依赖 `@tiptap/extension-drag-handle`、`@tiptap/extension-drag-handle-vue-3`、`@tiptap/extension-dropcursor` 和 `@tiptap/extension-node-range`，这些依赖已随组件库安装。

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
- ✅ AI 内容生成（外部接口配置，支持流式响应）
- ✅ AI 流式 Markdown 渲染
- ✅ AI 操控编辑器（结构化 actions 白名单执行）
- ✅ 元素拖拽排序（桌面端，悬停显示拖拽手柄）
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
| `aiConfig` | Object | `{ baseUrl: '', apiKey: '' }` | AI 配置，支持内容生成和 `mode: 'actions'` 操控编辑器模式；请求侧支持 `requestBody`、`buildBody`、`buildRequest`、`headers`、`method`、`parseResponse` |

#### 组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | String | 内容变化时触发 |
| `uploadPhoto` | File[] | 选择图片时触发，支持单图和多图 |
| `uploadVideo` | File[] | 选择视频时触发，支持单视频和多视频 |
| `paste` | Object | 粘贴内容时触发，可拦截图片等文件粘贴 |
| `drop` | Object | 拖放文件到编辑器时触发 |
| `ready` | - | 编辑器初始化完成时触发 |
| `focus` | - | 编辑器获得焦点时触发 |
| `blur` | - | 编辑器失去焦点时触发 |
| `selectionChange` | Object | 选区变化时触发，返回 `from`、`to`、`text`、`empty` |
| `linkClick` | Object | 点击编辑器内链接时触发，可拦截默认跳转行为 |
| `beforeChange` | Object | 内容即将变化时触发，可阻止本次内容变更 |

#### 粘贴图片处理

默认情况下，如果没有监听 `paste` 事件，编辑器会继续执行 Tiptap / ProseMirror 的默认粘贴逻辑。也就是说，从剪贴板粘贴图片时，仍可能产生 `data:image/...;base64` 内容。

如果业务侧希望避免 base64 图片写入数据库，可以在 `paste` 事件中拦截文件，上传到自己的服务器后再插入图片 URL：

```vue
<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
    @paste="handlePaste"
  />
</template>

<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()
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

  editor.value?.insertImages(urls)
}
</script>
```

#### 链接点击处理

默认情况下，编辑器内链接不会在普通点击时直接打开；按住 Ctrl 或 Meta 点击链接时，会在新标签页打开。业务侧可以监听 `linkClick` 事件，读取链接地址并按需接管跳转行为。

```vue
<template>
  <sky-tiptap
    v-model="content"
    @link-click="handleLinkClick"
  />
</template>

<script setup>
const handleLinkClick = (linkClickEvent) => {
  if (!linkClickEvent.href) return

  linkClickEvent.preventDefault()

  // 这里可以替换为业务侧路由、链接预览弹窗或跳转确认
  window.open(linkClickEvent.href, '_blank', 'noopener,noreferrer')
}
</script>
```

#### 内容变化前拦截

`beforeChange` 事件会在编辑器内容即将变化、但尚未应用到编辑器状态前触发。业务侧可以读取变化前后的 HTML，并调用 `preventDefault()` 阻止本次内容变更。

```vue
<template>
  <sky-tiptap
    v-model="content"
    @before-change="handleBeforeChange"
  />
</template>

<script setup>
const MAX_HTML_LENGTH = 10000

const handleBeforeChange = (beforeChangeEvent) => {
  if (beforeChangeEvent.nextHTML.length <= MAX_HTML_LENGTH) return

  beforeChangeEvent.preventDefault()
}
</script>
```

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

当前版本：**1.10.0**

详细更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)
