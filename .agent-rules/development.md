# Sky Tiptap 开发规范

## 1. 样式管理

- 所有设计令牌统一放在 `src/styles/variables.css`，通过 CSS 变量使用。
- 样式分层遵循以下结构：
  - `src/styles/variables.css`：颜色、间距、圆角、阴影等设计令牌
  - `src/styles/base.css`：重置、布局、通用组件样式、第三方样式引入
  - `src/styles/editor.css`：编辑器内容区域样式
  - `src/styles/themes/`：主题相关样式
- 组件级样式优先使用 `scoped` 或其他局部化方式，避免污染全局。
- 第三方样式应集中通过 `src/styles/` 引入，不要分散到多个组件。

禁止事项：

- 禁止硬编码颜色值，除非是用户明确要求的临时或计算型场景。
- 禁止把固定样式写成模板内联 `style`。
- 非迁移任务不要继续往 `src/style/` 添加新样式。

## 2. 组件与目录职责

推荐的组件结构与职责边界如下：

- `src/components/SkyTiptap.vue`
  - 主编辑器组件
  - 负责组合 Toolbar、Bubble Menu、Insert Menu 和文件选择逻辑
- `src/components/Toolbar/`
  - 工具栏主界面与按钮组件
- `src/components/BubbleMenu/`
  - 选区悬浮菜单
- `src/components/NodeView/`
  - Tiptap NodeView 组件
- `src/extensions/`
  - 自定义 Tiptap 扩展
- `src/config/default.js`
  - 编辑器默认配置与扩展注册的唯一主入口
- `src/utils/emitter.js`
  - 基于 `mitt` 的组件间事件通信
- `src/utils/ai.js`、`src/utils/ai-actions.js`、`src/utils/ai-intent.js`
  - AI 内容生成请求、流式响应解析、本地意图解析、结构化 actions 白名单执行、执行摘要和预览/回滚支撑

以下旧入口已清理，不再作为开发入口：

- `src/index.vue`（已删除）
- `src/utils/index.js`（已删除）

`src/style/` 保留在仓库中，但新增样式应进入 `src/styles/`。

## 3. Tiptap 扩展与配置

- `src/config/default.js` 中的 `TipTapPlugin` 是唯一的主配置入口。
- 自定义扩展统一放在 `src/extensions/`。
- 自定义 NodeView 需通过 `VueNodeViewRenderer` 注册 Vue 组件。
- 现有关键配置点应保持一致，除非任务明确要求调整：
  - `StarterKit.configure({ codeBlock: false })`
  - 标题级别限制为 H1-H3
  - 使用 `CodeBlockLowlight` 处理代码块
  - `enableInputRules: true`
  - `Link.configure({ openOnClick: false })`
  - 链接通过 Ctrl 或 Meta + Click 手动打开

## 4. 兼容层边界

- 当前仓库存在兼容层与过渡实现，新增需求时不要进一步扩大这部分范围。
- `src/main.js` 是纯净的库导出入口，不包含示例应用代码。
- `src/demo.js` 是独立的开发环境入口，用于 `npm run dev`。
- `window.skyTiptapEditor` 一类全局兼容能力仅用于兼容历史调用方式；不要把它当成新 API 的首选入口。
- 如果任务与清理优化相关，优先参考 `CLEANUP_OPTIMIZATION.md`，不要再产生并行实现入口。

## 5. 依赖与环境

- Node.js >= 18.0.0
- npm >= 10.0.0
- 核心技术栈以 Vue 3、Tiptap 2.x、Vite 6.x 为主

新增依赖时应优先考虑：

- 是否真能减少复杂度
- 是否会显著扩大构建产物体积
- 是否会引入与现有编辑器扩展冲突的实现路径

## 6. 验证建议

根据改动范围选择最小但有效的验证方式：

- 组件/逻辑变更：优先运行 `npm test`
- 构建、导出、打包相关变更：运行 `npm run build`
- 文档或纯规则文件变更：可不跑测试，但要确保路径、名称和规则引用一致

如果改动涉及编辑器行为、入口导出或兼容层，默认至少检查一次相关测试或构建是否仍然成立。
