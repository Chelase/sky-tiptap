# Sky Tiptap - 测试报告

> 项目: `@Chelase/sky-tiptap`  
> 当前版本: `1.7.0`  
> 最后验证日期: 2026-05-04  
> 验证环境: Windows PowerShell, Node.js/npm 本地依赖环境  

---

## 1. 执行摘要

| 检查项 | 状态 | 结果 |
|--------|------|------|
| 单元测试 | 通过 | `node .\node_modules\vitest\vitest.mjs run`，13 个测试文件、112 个用例通过 |
| 构建测试 | 通过 | `npm run build` 成功生成 ES 与 UMD 产物 |
| 文档构建 | 通过 | `npm run docs:build` 成功生成 VitePress 静态站点 |
| 库入口 | 通过 | `src/main.js` 为纯导出入口，不挂载示例应用 |
| 开发入口 | 通过 | `index.html` 使用 `/src/demo.js` 启动本地示例 |
| 主配置来源 | 通过 | `src/config/default.js` 是 Tiptap 默认配置唯一主入口 |
| SSR 风险项 | 已修复 | DOM 监听已移入组件生命周期，并带运行环境判断 |
| 文档一致性 | 已同步 | 根目录文档、Agent 文档、VitePress 文档已按 1.7.0 当前结构更新 |

---

## 2. 当前验证结果

### 单元测试

命令：

```bash
node .\node_modules\vitest\vitest.mjs run
```

结果：

```text
Test Files  13 passed (13)
Tests       112 passed (112)
```

当前测试覆盖：

| 测试文件 | 覆盖范围 |
|----------|----------|
| `ai.test.js` | AI 请求体、响应解析、Markdown 渲染、流式响应处理 |
| `ai-actions.test.js` | AI actions 解析、校验、白名单执行和参数限制 |
| `ai-intent.test.js` | 本地意图解析、AI 文本补充解析和明确命令识别 |
| `BubbleMenu.test.js` | 选区悬浮菜单渲染和命令触发 |
| `CustomParagraphComponent.test.js` | 自定义段落组件交互 |
| `emitter.test.js` | `mitt` 事件总线 |
| `extensions.test.js` | 自定义扩展和视频 ID 解析 |
| `icons.test.js` | 图标导出与获取 |
| `InsertMenu.integration.test.js` | 插入菜单、图片/视频/表格/分割线/AI 事件 |
| `main.test.js` | 库入口导出和兼容工具函数 |
| `SkyDialog.test.js` | 统一弹窗输入、消息、校验和关闭行为 |
| `SkyTiptap.test.js` | 主组件挂载、Props、事件和暴露方法 |
| `ToolbarButton.test.js` | 工具栏按钮渲染、禁用态、激活态和点击 |

### 构建

命令：

```bash
npm run build
```

结果：

```text
dist/sky-tiptap.css     26.72 kB | gzip:   4.38 kB
dist/sky-tiptap.es.js 1058.53 kB | gzip: 301.32 kB
dist/sky-tiptap.umd.js 702.76 kB | gzip: 234.59 kB
```

构建完成后 `postbuild` 会执行 `rimraf ./dist/assets`，保持发布产物只包含库文件。

---

## 3. 当前架构状态

### 入口职责

| 文件 | 当前职责 |
|------|----------|
| `src/main.js` | 组件库公共导出入口，无示例挂载副作用 |
| `src/demo.js` | 本地开发示例应用入口 |
| `index.html` | Vite 开发页，加载 `/src/demo.js` |

### 主线实现

| 模块 | 当前职责 |
|------|----------|
| `src/components/SkyTiptap.vue` | 主编辑器组件，组合工具栏、悬浮菜单、插入菜单、统一弹窗、文件选择和 AI 生成 |
| `src/config/default.js` | Tiptap 默认配置唯一主入口 |
| `src/extensions/` | 当前自定义 Tiptap 扩展目录 |
| `src/utils/ai.js` | AI 请求配置、响应解析、Markdown 渲染和流式读取 |
| `src/utils/ai-actions.js` | AI actions JSON 解析、schema 校验和白名单执行 |
| `src/utils/ai-intent.js` | 从用户输入和 AI 文本中解析候选编辑器动作 |
| `src/utils/emitter.js` | 组件间事件通信 |
| `src/styles/` | 当前样式与设计变量目录 |

### 兼容层

`src/main.js` 仍保留以下兼容导出：

- `editorRef`
- `insertImage`
- `insertImages`
- `insertVideo`
- `insertVideos`
- `getContent`

这些工具函数通过 `window.skyTiptapEditor` 访问当前编辑器实例。该能力用于兼容历史调用方式；新代码更推荐通过组件 `ref` 调用 `defineExpose` 暴露的方法。

---

## 4. 已收束问题

以下问题已经在当前代码中收束：

- 库入口与 demo 入口已分离。
- `src/main.js` 不再执行 `createApp(...).mount(...)`。
- 顶层 `document.addEventListener` 已移除。
- DOM 相关监听移动到 `SkyTiptap.vue` 生命周期内。
- `window` / `document` 访问已有运行环境判断。
- Tiptap 配置统一到 `src/config/default.js`。
- 公共导出统一为 `SkyTiptap`，不再导出重复组件名。
- 图片选择事件统一返回 `File[]`。
- 视频上传事件统一返回 `File[]`。
- AI 生成支持普通文本、常见 JSON 响应字段和 SSE 流式响应。
- AI actions 模式支持基础编辑、链接、分割线、媒体嵌入、iframe 和本地文件选择入口等受控动作。
- AI 意图解析支持本地优先执行明确命令；`auto` 模式支持无法识别动作时回退插入 Markdown 内容。
- AI actions 执行链支持执行前预览、只预览不执行、失败回滚和可选执行结果摘要。
- 插入菜单中的表格、分割线、代码块、图片、视频和 AI 入口已有对应处理。

---

## 5. 当前仍需关注

### 依赖安全

本次文档同步没有重新执行 `npm audit`。如果准备发布，应重新运行：

```bash
npm audit
```

根据历史记录，曾需要关注的依赖包括 `vite`、`rollup`、`markdown-it`、`handlebars`、`picomatch` 等。实际风险应以当前 `npm audit` 输出为准。

### 包体积

当前构建体积相较早期版本已经明显下降，但 ES 产物仍约 1 MB。后续可继续评估：

- 代码块高亮语言是否进一步按需化。
- AI、视频、表格等能力是否需要拆分为可选扩展入口。
- 是否需要提供更轻量的基础编辑器构建。

### 图标渲染

部分组件通过 `v-html` 渲染本地图标字符串。当前图标来源是仓库内静态定义，风险可控；如果未来允许外部注入图标内容，需要改为组件化渲染或引入净化流程。

---

## 6. 验证命令

```bash
npm test
npm run build
npm run docs:build
```

本次实际执行的测试命令是：

```bash
node .\node_modules\vitest\vitest.mjs run
```

---

*最后更新：2026-05-04*
