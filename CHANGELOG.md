## 1.8.0 (2026-05-21)

### 新增功能

- **新增元素拖拽排序**：为编辑器接入块级元素拖拽排序能力，使用 Tiptap 官方 `drag-handle` 扩展：
  - 支持段落、标题、图片、视频、表格、代码块、iframe、引用块、列表等所有块级节点拖拽
  - 悬停显示六点式 grip icon 拖拽手柄
  - 拖拽时显示主题色落点指示线
  - 拖拽操作支持 undo/redo

---

## 1.7.1 (2026-05-16)

### 新增功能

- **新增编辑器事件 API**：补齐编辑器组件应有的基础事件：
  - `paste` / `drop`：拦截粘贴和拖放操作，用于处理剪贴板图片等外部文件
  - `ready`：编辑器初始化完成时触发
  - `focus` / `blur`：编辑器获得/失去焦点时触发
  - `selectionChange`：编辑器选区变化时触发，包含位置和选中文本
- **新增粘贴图片处理**：外部业务可在 `paste` 事件中调用 `preventDefault()` 阻止图片以 base64 写入，上传后用 URL 替换。

### 优化

- **修正依赖分类**：`@vitejs/plugin-vue` 从 `dependencies` 移至 `devDependencies`，缩小库消费者安装体积。

### 文档

- 拆分 `docs/api/index.md` 为按主题分类的独立页面（组件配置、事件、实例方法、媒体 API、AI API）。
- README 和图片上传指南补充粘贴处理说明和事件 API 文档。

---

## 1.7.0 (2026-05-04)

### 新增功能

- **新增 AI actions 执行前预览**：`aiConfig.previewActions = true` 时，项目会先展示本地/AI 文本解析出的受控操作摘要，用户确认后才执行。
- **新增只预览不执行模式**：`aiConfig.executeActions = false` 时只展示操作预览，不调用 Tiptap command，便于调试 AI 意图解析结果。
- **新增 actions 执行失败回滚**：默认开启 `rollbackOnActionFailure`，action 组执行失败时恢复执行前内容，避免部分成功导致编辑器内容不一致。
- **新增执行结果摘要**：`aiConfig.showActionResult = true` 时，执行成功后展示本次受控操作摘要。
- **新增 action 描述工具**：`src/utils/ai-actions.js` 新增 `describeAiAction` / `describeAiActions`，用于预览、结果提示和测试断言。

### 体验优化

- 统一弹窗消息支持多行展示，操作预览和结果摘要更易读。
- action 执行结果现在携带人类可读 `summary`，错误消息也优先使用可读操作名称。

### 测试

- 扩展 `ai-actions.test.js`，覆盖 action 描述和执行摘要。
- 扩展 `SkyTiptap.test.js`，覆盖预览确认、只预览不执行、失败回滚和执行结果提示。
- 验证通过：13 个测试文件、112 个用例通过；目标测试 2 个文件、44 个用例通过。

---

## 1.6.0 (2026-05-04)

### 架构调整

- **新增本地 AI 意图解析层**：新增 `src/utils/ai-intent.js`，项目会先从用户输入中确定性解析编辑器动作，明确命令不再依赖 AI 返回 JSON。
- **新增 `aiConfig.mode = 'auto'`**：自动模式会优先尝试执行本地/AI 文本解析出的编辑器动作；无法识别动作时，将 AI 返回内容按 Markdown 插入。
- **重构 actions 模式执行流程**：`actions` 模式现在按“用户输入本地解析 -> AI 文本补充解析 -> 白名单执行”运行，AI 输出不再是唯一协议来源。
- **完善缺参交互**：当用户说“插入抖音视频”但未提供地址时，由项目打开现有抖音链接输入弹窗；Bilibili、YouTube、iframe、图片 URL、视频 URL、链接等同理。

### 行为变化

- “插入抖音视频：https://...”这类明确命令会直接由项目解析并执行，不调用 AI 接口。
- AI 返回普通文本时，`actions` 模式会提示未识别到可执行操作；`auto` 模式会把普通文本作为 Markdown 内容插入。
- 本地上传命令仍只触发现有文件选择入口，不由 AI 读取或上传文件。

### 测试

- 新增 `src/__tests__/ai-intent.test.js`。
- 更新 `SkyTiptap.test.js`，覆盖本地意图优先、缺参弹窗和 `auto` 模式回退。
- 验证通过：13 个测试文件、106 个用例通过。

---

## 1.5.0 (2026-05-04)

### 新增功能

- **扩展 AI 操控编辑器 actions 白名单**：补齐第二阶段编辑器能力，覆盖列表、链接、分割线、图片、视频、iframe 和本地上传入口。
- **新增文本与格式动作**：
  - `toggleBulletList`
  - `toggleOrderedList`
  - `setLink`
  - `unsetLink`
  - `insertDivider`
- **新增媒体与嵌入动作**：
  - `insertImage`
  - `insertUploadedVideo`
  - `insertBilibiliVideo`
  - `insertYoutubeVideo`
  - `insertDouyinVideo`
  - `insertIframe`
- **新增本地文件选择动作**：
  - `requestImageUpload`
  - `requestVideoUpload`

### 安全约束

- URL 类 action 只接受 `http:` / `https:` 地址。
- Bilibili、YouTube、抖音 action 仍走现有视频 ID 提取和校验路径。
- 本地上传 action 只触发现有文件选择入口，不读取、不上传、不伪造文件内容。
- actions 仍保持整体校验通过后再执行，任一 action 非法时不会执行部分结果。

### 测试

- 扩展 `ai-actions.test.js`，覆盖第二阶段 action 映射、URL 校验和上传入口回调。
- 更新 `SkyTiptap.test.js`，覆盖 actions 模式触发本地文件选择入口。
- 验证通过：12 个测试文件、93 个用例通过。

---

## 1.4.0 (2026-05-04)

### 新增功能

- **新增 AI 操控编辑器 actions 模式**：`aiConfig.mode = 'actions'` 时，AI 返回结构化 JSON actions，编辑器只执行内置白名单动作，不执行 DOM 点击或任意 JavaScript。
- **新增 AI actions 工具模块**：新增 `src/utils/ai-actions.js`，负责 JSON 提取、schema 校验、参数归一化和 Tiptap command 映射。
- **支持第一阶段 4 个受控动作**：
  - `insertMarkdown`
  - `setHeading`
  - `insertTable`
  - `insertCodeBlock`
- **新增 actions 模式错误处理**：非法 JSON、未知 action、参数越界或 command 执行失败时，会通过统一弹窗提示“AI 操作失败”。

### 安全约束

- actions 必须整体通过校验后才执行。
- 表格限制为 `rows <= 20`、`cols <= 10`。
- 标题限制为 H1-H3。
- 代码块仅插入文本，不执行代码。

### 测试

- 新增 `src/__tests__/ai-actions.test.js`。
- 更新 `SkyTiptap.test.js`，覆盖 actions 模式集成流程。
- 验证通过：12 个测试文件、85 个用例通过。

---

## 1.3.0 (2026-05-03)

### 架构优化

**P0 高优先级修复**
- **分离库入口与示例应用**：创建独立的 `src/demo.js` 作为开发环境入口，`src/main.js` 现在是纯净的库导出入口，不包含任何副作用
- **修复 SSR 兼容性**：移除顶层 `document.addEventListener`，将全局点击监听器移至 `SkyTiptap.vue` 组件生命周期，添加环境检查确保服务端渲染安全
- **清理重复配置**：移除重复入口，`src/config/default.js` 成为唯一配置来源
- **统一导出命名**：移除重复组件导出，统一使用 `SkyTiptap`

### 性能优化

- **大幅减少包体积**：将 highlight.js 从全量导入改为按需导入 16 种常用语言
  - 当前验证产物：ESM 约 1,040 KB（gzip 约 297 KB）
  - 当前验证产物：UMD 约 689 KB（gzip 约 230 KB）

### 功能完善

- **完善视频嵌入校验**：插入菜单中的 Bilibili、YouTube、抖音视频都会先提取视频 ID；未匹配到 ID 时给出提示并停止插入
- **完善抖音视频嵌入**：抖音视频现在会提取 `video_id`，并使用抖音开放平台 iframe 播放器地址生成嵌入节点
- **优化代码块编辑体验**：连续按回车时不再自动退出代码块
- **调整工具栏默认行为**：`showToolbar` 默认改为 `false`，工具栏默认关闭，可通过参数显式打开
- **增强悬浮菜单**：Bubble Menu 新增 H1/H2/H3、无序列表和有序列表操作
- **支持多图上传**：图片选择支持多选，`uploadPhoto` 统一返回 `File[]`，新增 `insertImages` 批量插入方法
- **支持视频上传**：视频菜单新增上传视频入口，新增 `uploadVideo` 事件和 `insertVideo` / `insertVideos` 插入方法，上传视频使用原生 `<video controls>` 渲染
- **修复上传视频显示**：上传视频节点改为响应式填充容器，避免只有声音没有画面或尺寸错位
- **新增统一弹窗组件**：视频链接插入、链接地址设置、网页 iframe 嵌入和错误提示统一使用现代化弹窗，替换原生 `prompt` / `alert`
- **新增 AI 生成能力**：通过 `aiConfig.baseUrl` / `aiConfig.apiKey` 配置外部接口，提交提示词后调用 API 并将返回内容插入编辑器
- **增强 AI 通用请求配置**：`aiConfig.requestBody` 改为原样传递，使用方可通过 `buildBody(prompt)` 或 `buildRequest` 自行决定如何把弹窗输入写入请求参数
- **支持 AI 流式 Markdown**：使用 `markdown-it` 将 AI 返回内容渲染为 HTML，`stream: true` 时支持 SSE 增量读取并持续更新同一段生成内容
- **优化 AI 生成交互**：确认提示词后立即关闭弹窗，在编辑器中显示骨架屏加载态；请求失败时移除加载态并显示错误提示

### 文档更新

- 更新 `TEST_REPORT.md`：同步 1.3.0 测试、构建和架构状态
- 更新 `CLEANUP_OPTIMIZATION.md`：改为当前清理状态基线
- 更新 `agent_readme.md`：同步项目结构和兼容层说明
- 更新 `.agent-rules/` 规则文档：反映当前主线实现路径

### 破坏性变更

无。所有公共 API 保持向后兼容。

### 验证

- ✅ 单元测试：72 个用例通过
- ✅ 构建测试：成功生成 UMD 和 ES 模块
- ✅ SSR 兼容性：Node.js 环境导入无错误
- ✅ 向后兼容性：所有公共 API 保持不变

---

## 1.2.1 (2026-05-01)

### Bug 修复
- 修复段落添加按钮按下时触发外层关闭的问题
- 修复插入菜单中视频平台子菜单点击时被误关闭的问题
- 修复视频嵌入节点与默认 YouTube 扩展并存时的冲突，统一使用自定义 `VideoEmbed` 节点

### 文档与规范
- 新增 `.agent-rules/` 项目规则目录，并补充 `AGENTS.md`、`CLAUDE.md` 与 Trae 桥接规则入口
- 新增 `CLEANUP_OPTIMIZATION.md`，记录项目结构清理与优化建议
- 同步更新 `README.md`、`agent_readme.md` 和提交前准备相关说明

## 1.2.0 (2026-04-12)

### 新增功能
- 添加代码块语法高亮（atom-one-dark 主题）
- 添加 Table 扩展支持表格插入
- 添加 Link 扩展支持链接
- 支持 Markdown 语法输入（## 标题、**加粗**等）

### Bug 修复
- 修复 Underline 扩展支持下划线
- 修复工具栏视频按钮点击无效问题
- 修复代码块无法输入内容、无法选择语言问题
- 修复链接功能无效问题
- 修复 Markdown 语法不生效问题

### 其他更新
- 新增项目开发规范文档（agent_readme.md）
- 删除冗余的 InsertMenu.vue 文件
- 添加链接 Ctrl+Click 在新标签页打开功能

## 1.1.0 (2025-02-18)
添加了左侧悬浮菜单

## 1.0.5 (2025-02-09)



## 1.0.4 (2025-02-09)

完善调用方式、更新说明文件

## 1.0.3 (2025-01-30)

添加上传图片

## 1.0.2 (2025-01-30)

更新了说明文件

## 1.0.1 (2025-01-30)

测试

