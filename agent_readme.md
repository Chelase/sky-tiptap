# Sky Tiptap - Agent README

## 项目概述

**Sky Tiptap** 是一款基于 Tiptap 和 Vue 3 的富文本编辑器组件库，目标是提供开箱即用的编辑体验和可扩展的多媒体能力。

- **源码包名：** `@Chelase/sky-tiptap`
- **当前版本：** `1.10.0`
- **技术栈：** Vue 3 + Tiptap 2.x + Vite 6.x
- **作者：** Chelsea

> 说明：GitHub Actions 会在发布时保留 GitHub Packages 的 `@Chelase/sky-tiptap`，并额外发布 npm 公共包 `sky-tiptap`。如果通过 npm 公共包接入，请把安装和 import 路径替换为 `sky-tiptap`。

---

## 规则入口

项目级 agent 规则统一维护在根目录 `.agent-rules/`：

- `.agent-rules/README.md` - 规则总览、读取顺序、优先级
- `.agent-rules/development.md` - 开发、样式、组件与验证规范
- `.agent-rules/release-docs.md` - 版本、文档、发布与提交准备规范

桥接入口文件：

- `AGENTS.md`
- `CLAUDE.md`
- `.trae/rules/agent-readme.md`

如果桥接文件与 `.agent-rules/` 冲突，应以 `.agent-rules/` 为准。

---

## 核心功能

### 1. 基础编辑能力

- 粗体、斜体、下划线、删除线
- 标题（H1-H3）
- 无序列表、有序列表
- 代码块语法高亮
- 文本高亮
- Typography 排版增强
- 撤销与重做

### 2. 多媒体与嵌入

- 图片上传
- Bilibili 视频嵌入
- YouTube 视频嵌入
- 抖音/TikTok 视频嵌入
- 网页 iframe 嵌入
- 表格插入
- 链接添加、`linkClick` 事件与 Ctrl 或 Meta + Click 打开
- 内容变化前拦截：`beforeChange` 事件可在 ProseMirror transaction 应用前阻止内容变更

### 3. 交互能力

- 工具栏（Toolbar）
- 选区悬浮菜单（Bubble Menu，含标题与列表）
- 插入菜单（Insert Menu）
- 自定义段落插入按钮
- 块级元素拖拽排序（官方 DragHandle + Dropcursor + NodeRange）

### 4. AI 能力

- AI 内容生成入口
- 流式 Markdown 渲染与同段内容更新
- 基于 `markdown-it` 将 AI 返回 Markdown 转换为可插入 HTML
- AI 操控编辑器：本地意图解析优先，AI 文本补充解析，最终通过白名单执行 Tiptap command；支持 `content`、`actions`、`auto` 三种模式，并支持 actions 执行前预览、只预览不执行、失败回滚和可选执行结果摘要

---

## 当前主线

当前推荐的主线实现如下：

- `src/components/SkyTiptap.vue`
  - 主编辑器组件
  - 负责组合 Toolbar、Bubble Menu、Insert Menu、统一弹窗和文件选择逻辑
- `src/config/default.js`
  - 编辑器默认配置唯一主入口
- `src/extensions/`
  - 自定义 Tiptap 扩展
- `src/utils/emitter.js`
  - 基于 `mitt` 的组件间通信
- `src/styles/`
  - 当前样式目录

已清理的旧入口不再作为可维护面：

- `src/index.vue`：已删除
- `src/utils/index.js`：已删除

`src/style/` 仍存在于仓库中，但不再作为新样式入口；新增样式应进入 `src/styles/`。

---

## 项目结构

```text
sky-tiptap/
├── .agent-rules/                # 项目级 agent 规则真来源
├── .trae/rules/agent-readme.md  # Trae 桥接规则入口
├── src/
│   ├── __tests__/               # Vitest 测试
│   ├── App.vue                  # 示例应用
│   ├── main.js                  # 库导出入口（纯净，无副作用）
│   ├── demo.js                  # 开发环境示例应用入口
│   ├── components/
│   │   ├── SkyTiptap.vue
│   │   ├── BubbleMenu/
│   │   ├── Dialog/
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.vue
│   │   │   ├── ToolbarButton.vue
│   │   │   └── Menu/InsertMenu.vue
│   │   ├── NodeView/
│   │   │   └── CodeBlock.vue
│   │   ├── CustomParagraphComponent.vue
│   │   └── tooltip.vue
│   ├── config/
│   │   └── default.js           # 唯一配置来源
│   ├── extensions/
│   │   ├── CustomParagraph.js
│   │   ├── iframe.js
│   │   └── web-video.js
│   ├── icons/
│   │   └── index.js
│   ├── styles/                  # 当前样式目录
│   ├── style/                   # 保留目录，不作为新样式入口
│   └── utils/
│       ├── ai.js                # AI 请求、响应解析与 Markdown 渲染
│       ├── emitter.js
│       └── extensions/          # 保留目录，不作为新扩展入口
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
└── vite.config.js
```

**注意**：
- `src/index.vue` 和 `src/utils/index.js` 已删除
- `src/main.js` 是纯净的库导出入口，不包含示例应用代码
- `src/demo.js` 是开发环境入口，用于 `npm run dev`

---

## 快速开始

### 安装

```bash
npm install @Chelase/sky-tiptap
```

如果通过 npm 公共包接入，请改用：

```bash
npm install sky-tiptap
```

### 基础使用

```vue
<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
  />
</template>

<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()
const content = ref('')
</script>
```

---

## API 参考

### 组件 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | String | `''` | 双向绑定的内容 |
| `theme` | String | `'default'` | 主题（`default` / `dark`） |
| `showToolbar` | Boolean | `false` | 是否显示工具栏 |
| `placeholder` | String | `'输入内容...'` | 占位符 |
| `aiConfig` | Object | `{ baseUrl: '', apiKey: '' }` | AI 配置，支持内容生成、`mode: 'actions'` 操控编辑器模式、执行前预览、只预览不执行和失败回滚；请求侧支持 `requestBody`、`buildBody`、`buildRequest`、`headers`、`method`、`parseResponse` |

### 组件事件

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

### 导出工具函数

```javascript
import { insertImage, insertImages, insertVideo, insertVideos, getContent } from '@Chelase/sky-tiptap'

insertImage('https://example.com/image.png')
insertImages([
  'https://example.com/one.png',
  'https://example.com/two.png'
])
insertVideo('https://example.com/video.mp4')
insertVideos([
  'https://example.com/one.mp4',
  'https://example.com/two.mp4'
])
const html = getContent()
```

### 组件暴露方法

`SkyTiptap` 组件实例当前暴露以下方法：

- `insertImage(url)`
- `insertImages(urls)`
- `insertVideo(url)`
- `insertVideos(urls)`
- `insertGeneratedContent(content)`
- `getContent()`
- `setContent(content)`

---

## 开发规范摘要

### 扩展与配置

- `src/config/default.js` 中的 `TipTapPlugin` 是唯一主配置入口
- 自定义扩展统一放在 `src/extensions/`
- AI actions 执行逻辑统一放在 `src/utils/ai-actions.js`
- 自定义 NodeView 使用 `VueNodeViewRenderer` 注册
- 块级拖拽能力使用 `@tiptap/extension-drag-handle-vue-3`、`@tiptap/extension-dropcursor` 和 `@tiptap/extension-node-range`
- 内容变化前拦截使用内部 `src/extensions/before-change.js`，基于 ProseMirror `filterTransaction`
- `CodeBlockLowlight` 替代 StarterKit 默认代码块
- 链接默认不直接打开，通过 Ctrl 或 Meta + Click 新标签页打开；业务侧可用 `linkClick` 接管链接点击

### 兼容层边界

- `window.skyTiptapEditor` 仅作为兼容层，不应作为新 API 的首选入口
- `src/main.js` 是纯净的库导出入口，不包含示例应用代码
- `src/demo.js` 是独立的开发环境入口，用于 `npm run dev`
- 新功能不要继续扩展 `src/style/`，新增样式进入 `src/styles/`

### 文档同步

当改动影响版本、发布行为、外部 API、安装方式或项目结构时，至少检查：

- `package.json`
- `CHANGELOG.md`
- `README.md`
- `.agent-rules/`
- `agent_readme.md`

---

## 构建、测试与发布

### 开发

```bash
npm run dev
```

### 测试

```bash
npm test
```

### 构建

```bash
npm run build
```

构建后会自动清理 `dist/assets`。

### 发布

当前自动发布流程定义在 `.github/workflows/publish.yml`：

- 触发条件：推送到 `master` 分支
- Node 版本：20
- 执行步骤：
  - `npm ci`
  - `npm run build`
  - 发布到 GitHub Packages
  - 临时将包名改为 `sky-tiptap`
  - 发布到 npm
  - 恢复 `package.json`

所需 secrets：

- `GH_PACKAGES_TOKEN`
- `NPM_TOKEN`

---

## 注意事项

1. **Node 版本要求：** >= 18.0.0
2. **npm 版本要求：** >= 10.0.0
3. **构建输出：** UMD + ES Module 双格式
4. **规则入口：** 项目级规则统一维护在 `.agent-rules/`
5. **发布目标：** GitHub Packages + npm

---

## 许可证

MIT License

---

## 当前验证基线

- 单元测试：13 个测试文件、128 个用例通过
- 构建测试：`npm run build` 通过
- 文档构建：`npm run docs:build` 通过
- 构建产物：ES Module + UMD + CSS

---

*最后更新：2026-06-07*
