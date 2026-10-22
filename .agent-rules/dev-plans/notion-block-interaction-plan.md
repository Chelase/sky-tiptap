# Notion 风格块级交互优化计划

> 状态：进行中（P0 已落地，P1/P2 待排期）
> 依据：2026-10-22 对本机 Notion 桌面端的只读逆向（REA 静态分析 + 本地 Service Worker 缓存中的编辑器 bundle）

## 1. 目标

把 sky-tiptap 的块级交互对齐 Notion：

- 块级「+」按钮对所有顶层块生效，而不是只有段落
- 插入菜单升级为可搜索的块目录，并与 `/` 快捷键共用
- 补齐块级键盘快捷键
- 拖拽过程具备落点提示与拖拽态
- 块级控件（左轨道）统一由一套定位算法计算

## 2. 逆向依据（Notion 实现要点）

取证位置：Notion 编辑器实现不在本地安装包（`app.asar` 仅 Electron 外壳），真实 bundle 位于
`%APPDATA%\Notion\Partitions\notion\Service Worker\CacheStorage`（本地缓存 803 个明文 chunk）。

| rspack module | 组件 | 关键规格 |
|---|---|---|
| `398193` | 「+」按钮 | 24×24、`radius 4`、`absolute + insetInlineStart`、`notion-block-add-button`、点击=下方插入、Option/Alt+点击=上方插入 |
| `633418` | ⠿ 拖拽手柄 | 18×24、三态 aria（拖+点/仅拖/仅点）、tooltip `delayThreshold: 300`、文案「Drag to move」「Click or ⌘/ to open menu」 |
| `104335` | 浮动控件组 | `padding 2` + `1px border` + `radius 8` + `shadow.outline.md` |
| `847172` | 通用拖拽列表原语 | `shouldAnimateDrop`、`draggingStyle`、`hideDraggingItem`、`getInvalidDropIndices`、让位动画 300ms、拖拽激活阈值 |
| `579993` | 块能力 hook | `canDrag` / `canSelect` / `canDropOnto` / `canDropLeftRight` / `showHoverMenu` / `shouldShowSelectionHalo` / `overrideCanDrag` |
| `ClientFramework` | 快捷键注册表 | 112 条块级键位（`moveUp`=`command+shift+up`、`commandSlash`、`duplicate`、`esc`…） |

**核心结论**：Notion 的「+」号、⠿ 手柄、右栏评论、菜单项不是独立组件，而是同一套块级 margin 定位系统下的 4 个 `marginItemType`，全部 `position: absolute` 并共享坐标计算。

## 3. 已完成

### P0（1.12.0）

- [x] 块级「+」按钮：`src/components/BlockControls/BlockAddButton.vue`，覆盖所有顶层块
- [x] 可搜索块目录：`src/config/insert-menu.js` + `InsertMenu.vue` 重写（搜索框 + 分组 + 265px + 视口收敛）
- [x] 统一插入层：`src/utils/block-insert.js`（消除菜单与段落按钮的重复实现）
- [x] 块级快捷键：`src/utils/keyboard-shortcuts.js`（`⌘/`、`⌘⇧↑↓`、`⌘D`、`Esc`、`⌘B/I/U`、`⌘⇧H`、`⌘K`）
- [x] 块级操作：`src/utils/block-actions.js`（`moveBlock` / `duplicateBlock` / `selectBlock`）
- [x] 块级定位：`src/utils/block-controls.js` + `--sky-gutter-width` 令牌，左轨道统一
- [x] 段落不再挂载 Vue NodeView，`CustomParagraph` 扩展与导出保持兼容
- [x] 修复 `before-change` 插件 key 冲突导致的编辑器创建失败

### P1

- [x] **块能力模型**：`src/config/block-capabilities.js`，按 Notion `579993` 的能力集合配置 `canDrag` / `canSelect` / `showHoverMenu` / `canDropOnto` / `canDropLeftRight`
- [x] **块选中态与焦点环**：`.ProseMirror-selectednode` 选中底色 + `:focus-within` 焦点环
- [x] **Slash 菜单**：`src/utils/slash-menu.js`，输入 `/` 唤起同一块目录，输入内容实时过滤，选中后自动删除 `/` 文本
- [x] **拖拽视觉态**：拖拽中降低块透明度（`.ProseMirror.dragging`）
- [x] **多栏结构**：`src/extensions/ColumnList.js`（columnList / column 节点）+ 块目录「两列 / 三列」
- [ ] **拖拽左右并排成列**：需要接管官方 drag-handle 的拖拽实现并做左右命中判定，单独排期

### P2

- [x] 清理死代码：`src/components/CodeBlockComponent.vue`、`src/components/tooltip.vue`、`src/style/index.scss`、`src/assets/svg/*`
- [x] 移除虚置依赖：`@tiptap/extension-node-range`（0 引用）、`@tiptap/extension-youtube`（import 被注释）
- [x] 修正文档漂移：`docs/optimization-replacement-notes.md` 中关于 node-range 的描述
- [x] `window.skyTiptapEditor` 全局单例：`src/utils/editor-registry.js` 跟踪活跃实例，多实例不再互相覆盖
- [x] 事件命名统一：新增 `ai-generate`，保留 `AI-generated` 兼容
- [x] 消费 `defaultToolbarConfig` / `defaultBubbleMenuConfig`：`src/config/menu-config.js` + `src/config/toolbar-items.js` 条目注册表，工具栏与悬浮菜单改为配置驱动
- [x] 样式硬编码外提：`editor.css` 中的 `#000` 改为设计令牌
- [x] `DragHandle` 指定独立 `pluginKey`，多实例不再冲突
- [x] 补测试盲区：块级键盘、块移动/复制/选中、块目录、插入菜单、slash 菜单、块能力、编辑器注册表、多栏
- [x] `SkyTiptap.vue` 拆分 AI 流程：抽离到 `src/utils/ai-flow.js`
- [x] 依赖与发布流程：仓库改用 pnpm（`link:` 本地包 npm 不支持），新增 `pnpm-lock.yaml`、CI 改用 `pnpm install --frozen-lockfile`

## 4. 待办

- [ ] 拖拽左右并排成列（需要自定义拖拽实现）
- [ ] 块级让位动画（对齐 Notion 300ms FLIP）
- [ ] 右栏悬浮操作区（评论、复制链接等）

## 5. 验收标准

- 标题、列表、表格、代码块、图片、视频 hover 均出现「+」按钮
- 「+」按钮与 ⠿ 手柄在同一条左轨道上并排、互不遮挡
- 插入菜单可搜索，选项按分组展示，靠近屏幕边缘时自动收敛
- `⌘/Ctrl+/` 打开的菜单与「+」按钮打开的是同一份块目录
- `⌘⇧↑/↓` 移动块、`⌘D` 复制块、`Esc` 选中块行为正确
- `npm test` 与 `npm run build` 通过
