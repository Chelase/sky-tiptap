## 1.12.1 (2026-10-22)

### 重构

- **块目录收成单一来源**：新增 `src/config/block-catalog.js`，把「有哪些块、每种块怎么创建、外部流程怎么触发」集中到一处；`src/config/insert-menu.js` 退化为菜单视图，`src/utils/block-insert.js` 退化为兼容层。此前 `table`/`codeBlock`/`divider`/`image`/`video`/`ai` 同时存在于两份目录，其中 `table` 有两套实现（节点 JSON 与 `insertTable` 命令），现在统一由 `insertBlock` 处理
- **块级控件几何收成一个模块**：新增 `src/utils/block-gutter.js`，`+` 号、块菜单锚点、拖拽手柄偏移共用同一组令牌与同一次 rect 解析；`--sky-gutter-width` 仍是视觉令牌真来源，JS 只做读取与兜底，并新增测试守护两边一致
- **菜单条目映射去重**：新增 `src/utils/menu-items.js` 的 `resolveMenuGroups(config, editor)`，Toolbar 与 BubbleMenu 不再各自复制一段 `key → {iconSvg,label,tooltip,isActive,disabled,run}` 映射
- `src/utils/block-controls.js` 只保留命中测试与顶层块解析，移除 `DEFAULT_BLOCK_CONTROL_OPTIONS`、`getBlockControlPosition`

### 行为变化

- **块插入菜单按 Notion 实测重做**：面板 324px 宽、10px 圆角、40vh 上限，阴影改为 Notion 的三层（1px 描边 + 5px/20px 投影）；首组内边距 4px、后续组 `6px 4px 4px` 并带 1px 缩进分隔线；行高 32px、行圆角 6px、图标 20px、文字 14px、右侧补 Markdown 快捷提示（`#`、`##`、`###`、`"`、`---`、`-`、`1.`、```` ``` ````），底部新增「关闭菜单 / esc」行。搜索框保留（Notion 的「+」是先插入空块再在块内筛选，我们的「+」仍靠搜索框），但改为 Notion 输入样式（灰底、无边框、无蓝色焦点环）；列表改为仅纵向滚动，消除横向滚动条
- 快捷提示由 `src/config/block-catalog.js` 的 `shortcut` 字段提供，通过新增的 `getBlockShortcut(type)` 读取，`insertMenuItems` prop 的条目形状保持不变
- 左侧轨道槽位改为「⠿ 拖拽手柄在外侧、`+` 号贴正文」：手柄右边缘距正文 `轨道宽 - 控件宽`（56 - 24 = 32px），`+` 号距正文 4px，块插入菜单锚点随之移到 `+` 号右侧 8px（即正文左边缘 + 4px）；两处偏移都由 `src/utils/block-gutter.js` 从同一组令牌派生

### Bug 修复

- 修复鼠标移入左侧轨道后「+」号与拖拽手柄消失、导致块级控件无法点击的问题：轨道内边距从 `.sky-editor` 移到 `.sky-prosemirror`（即 ProseMirror 的可编辑盒子内），指针不再触发编辑器的 `mouseleave`，官方 DragHandle 的坐标命中也能正常解析；同时移除 `base.css` 中用 `padding` 简写覆盖轨道宽度的旧规则，「+」号位置与 `--sky-gutter-width` 重新对齐
- 修复指针停在块间空隙（段落 `margin`）时「+」号跳到下一块、与拖拽手柄指向不同块的问题：此时 `posAtCoords` 会给出下一块，而官方 DragHandle 找不到 DOM 元素会保持上一块；「+」号改为用 `isPointInBlockBand` 判断指针是否落在块的纵向带内，不在带内时保持当前块，与手柄行为一致
- 修复块插入菜单右侧留白不一致的问题：项目全局样式默认 `content-box`，搜索框 `width: 100%` 叠加左右内边距后比面板内容区宽 16px、直接顶到面板右边缘；菜单内统一改为 `border-box`，搜索框、行高亮、底部「关闭菜单」行共用同一条内容列（左右各 4px），行内图标 / 文字 / 快捷提示与底部 `esc` 左右对齐
- 块插入菜单的滚动条改为内部浮层滑块：隐藏原生滚动条（不再占 15px 布局宽度、右侧不再出现独立占位槽），列表内用 4px 圆角滑块贴面板右侧内边距浮动，悬停菜单或滚动时淡入、支持拖拽
- 修复块插入菜单按 `Esc` 关不掉的问题：`hide()` 原先用事件对象做「点在菜单内就跳过」的判断，而搜索框上的 `Esc` 正是从菜单内部冒泡上来的，于是被直接忽略；现在把「点击外部关闭」拆成独立的 `handleDocumentMouseDown`，`hide()` 只负责关闭，菜单内任意位置按 `Esc` 都能关闭，并把焦点还给编辑器

---

## 1.12.0 (2026-10-22)

### 新增功能

- **块级「+」按钮**：新增 `src/components/BlockControls/BlockAddButton.vue`，把原本只挂在段落上的插入按钮升级为块级控件，标题、列表、表格、代码块、图片、视频等顶层块 hover 时都会出现，并与拖拽手柄共用同一条左侧轨道
- **可搜索的块插入菜单**：插入菜单改为「搜索框 + 分组 + 265px 面板」形态，块目录统一收敛到 `src/config/insert-menu.js`，支持通过 `insertMenuItems` prop 覆盖
- **统一块插入层**：新增 `src/utils/block-insert.js`，插入菜单、工具栏与快捷键共用同一套插入逻辑，消除了菜单与段落按钮各写一份的重复实现
- **块级快捷键**：新增 `src/utils/keyboard-shortcuts.js`，支持 `⌘/Ctrl+/` 打开块菜单、`⌘/Ctrl+⇧↑/↓` 移动块、`⌘/Ctrl+D` 复制块、`Esc` 选中当前块、`⌘/Ctrl+B/I/U` 文本格式、`⌘/Ctrl+⇧H` 高亮、`⌘/Ctrl+K` 链接
- **块级操作工具**：新增 `src/utils/block-actions.js`，提供 `moveBlock`、`duplicateBlock`、`selectBlock`
- **块级定位工具**：新增 `src/utils/block-controls.js`，统一计算「+」按钮、拖拽手柄等块级控件的位置
- **新增图标**：`text`、`heading1`、`heading2`、`heading3`、`quote`
- **Slash 菜单**：新增 `src/utils/slash-menu.js`，在空块输入 `/` 即可唤起同一块目录，继续输入会实时过滤，选中后自动清除 `/` 文本
- **块能力模型**：新增 `src/config/block-capabilities.js`，按 Notion 的能力集合配置每种块的 `canDrag` / `canSelect` / `showHoverMenu` / `canDropOnto` / `canDropLeftRight`，并可通过 `blockCapabilities` prop 覆盖
- **多栏结构**：新增 `src/extensions/ColumnList.js`（columnList / column 节点），块目录新增「两列 / 三列」
- **块选中态与焦点环**：顶层块选中时显示底色，获得焦点时显示焦点环
- **拖拽视觉态**：拖拽过程中降低被拖拽块的透明度
- **配置驱动的工具栏与悬浮菜单**：新增 `src/config/menu-config.js` 与 `src/config/toolbar-items.js`，`defaultToolbarConfig` / `defaultBubbleMenuConfig` 现在真正生效，条目行为集中在注册表
- **编辑器实例注册表**：新增 `src/utils/editor-registry.js`，多实例场景下 `window.skyTiptapEditor` 不再互相覆盖
- **AI 流程拆分**：AI 内容生成与操控编辑器的流程抽离到 `src/utils/ai-flow.js`

### 行为变化

- 段落不再使用自定义 Vue NodeView，段落 HTML 不再包含 `div.custom-paragraph` 包裹层；`CustomParagraph` 扩展与导出保持不变，节点名仍为 `paragraph`
- 左侧轨道宽度改为由 `--sky-gutter-width`（56px）控制，「+」按钮与拖拽手柄位置统一由块级定位工具计算
- 拖拽手柄 tippy 偏移由 `[3, 36]` 调整为 `[0, 4]`，与「+」按钮并排显示在同一条轨道上
- 内部事件 `hide-all-paragraph-buttons` 不再触发（块级按钮改为 hover 驱动）
- 仓库依赖管理由 npm 切换为 pnpm（仓库通过 `link:` 依赖本地扩展包，npm 不支持该协议），新增 `pnpm-lock.yaml`，发布流水线改用 `pnpm install --frozen-lockfile`
- 移除未使用的 `@tiptap/extension-node-range`、`@tiptap/extension-youtube` 依赖

### Bug 修复

- 修复 `before-change` 扩展未声明插件 key 时，可能与编辑器内其他插件 key 冲突、导致编辑器创建失败的问题
- 修复插入菜单未做视口收敛，靠近屏幕边缘时可能溢出的问题
- 修复多编辑器实例共用 `window.skyTiptapEditor` 时后挂载实例会顶掉先前实例的问题

---

## 1.11.0 (2026-06-07)

### 新增功能

- **接入官方 Placeholder 扩展**：`placeholder` prop 现在会通过 `@tiptap/extension-placeholder` 真正渲染为空编辑器占位提示，并随组件 prop 更新保持同步。
- **新增运行依赖**：显式声明 `@tiptap/extension-placeholder`，确保组件库消费者安装后可直接使用占位符能力。

### 测试

- 补充 `placeholder` 组件配置测试，覆盖默认占位符和自定义占位符 prop 更新。

---

## 1.10.0 (2026-06-07)

### 新增功能

- **新增 `beforeChange` 事件**：编辑器内容即将变化时触发，业务侧可读取 `currentHTML`、`nextHTML`、原始 transaction 和编辑器状态，并可调用 `preventDefault()` 阻止本次内容变更。
- **新增内容变更过滤扩展**：通过 ProseMirror `filterTransaction` 在内容变更应用前拦截，只处理会改变文档内容的 transaction，不拦截纯选区变化。

### 测试

- 补充 `beforeChange` 组件事件测试和底层扩展测试，覆盖事件抛出、阻止内容变更、放行内容变更和忽略非内容变更 transaction。

---

## 1.9.0 (2026-06-07)

### 新增功能

- **新增 `linkClick` 事件**：点击编辑器内链接时向外抛出链接点击事件，业务侧可读取 `href`、原始点击事件和编辑器位置，并可调用 `preventDefault()` 接管跳转行为。
- **保留原有链接打开方式**：业务侧未拦截时，Ctrl 或 Meta + Click 仍会按原行为在新标签页打开链接。

### 测试

- 补充链接点击事件测试，覆盖事件抛出、业务侧阻止默认行为，以及 Ctrl/Meta 点击继续打开链接。

---

## 1.8.1 (2026-06-07)

### 优化

- **完善元素拖拽排序接入**：拖拽手柄现在只在存在多个可拖拽顶层区块时显示，并为当前悬停区块提供更明确的无障碍标签。
- **收敛拖拽手柄样式层级**：区分官方 DragHandle 外层容器和项目视觉按钮，避免重复 `drag-handle` 类导致定位层与按钮样式混用。
- **修复左侧操作按钮重叠**：将拖拽手柄放在段落 `+` 插入按钮左侧，并与 `+` 按钮保持垂直居中对齐，同时为编辑器桌面端左侧预留操作栏空间。
- **修复左侧操作区可达性**：段落左侧增加 hover 通道并延迟隐藏 `+` 按钮，鼠标从段落移向拖拽手柄时按钮不会立即消失。
- **显式声明拖拽范围依赖**：将 `@tiptap/extension-node-range` 列为运行依赖，确保官方 drag-handle 的节点范围拖拽能力对组件库消费者可见。

### 测试

- 补充拖拽手柄配置、多编辑器实例、图片/视频/iframe/表格块和外部内容变化的组件测试覆盖。

---

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

