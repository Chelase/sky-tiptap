# Sky Tiptap 清理优化状态

> 当前版本：`1.7.0`  
> 最后更新：2026-05-04  
> 依据材料：当前代码、`package.json`、`README.md`、`agent_readme.md`、`TEST_REPORT.md`、`.agent-rules/`

---

## 1. 文档目的

本文件记录 `sky-tiptap` 当前已经完成的结构收束、仍需关注的优化点，以及后续维护时应遵守的项目基线。

它不是待执行的历史计划；当前仓库已经完成入口分离、主配置统一、SSR 风险修复和文档同步。

---

## 2. 当前项目基线

`sky-tiptap` 是一个 Vue 3 + Tiptap 2.x 富文本编辑器组件库，当前版本为 `1.7.0`。

当前项目状态：

- 组件库入口清晰：`src/main.js` 只负责公共 API 导出。
- 开发示例入口独立：`src/demo.js` 负责本地 demo 挂载。
- 主编辑器组件明确：`src/components/SkyTiptap.vue`。
- 默认配置唯一：`src/config/default.js`。
- 当前扩展目录明确：`src/extensions/`。
- 当前样式目录明确：`src/styles/`。
- 测试基础完整：13 个测试文件、106 个用例通过。
- 构建链路可用：`npm run build` 输出 ES 与 UMD 产物。
- 发布链路明确：`master` 分支 GitHub Actions 同步发布 GitHub Packages 与 npm 公共包。

---

## 3. 已完成的清理项

### 3.1 入口职责收束

已完成：

- `src/main.js` 不再挂载 Vue 示例应用。
- `src/demo.js` 作为本地开发示例入口。
- `index.html` 使用 `/src/demo.js`。
- 库构建入口保持 `src/main.js`。

结果：

- 导入库不会触发示例应用副作用。
- SSR、测试和发布入口更清晰。

### 3.2 SSR 风险修复

已完成：

- 移除库入口中的顶层 DOM 监听。
- 全局点击监听移动到 `SkyTiptap.vue` 生命周期。
- `document` / `window` 访问增加运行环境判断。
- 卸载时清理全局事件监听和兼容编辑器引用。

结果：

- 服务端或 Node.js 环境导入库时不会因为顶层 DOM 访问报错。

### 3.3 主配置统一

已完成：

- Tiptap 默认配置统一维护在 `src/config/default.js`。
- 自定义扩展统一从 `src/extensions/` 注册。
- 代码块使用 `CodeBlockLowlight` 与 Vue NodeView。
- 标题级别限制为 H1-H3。
- 链接保持 `openOnClick: false`，通过 Ctrl 或 Meta + Click 打开。

结果：

- 新增扩展和默认行为调整都有明确入口。

### 3.4 公共导出收束

当前 `src/main.js` 导出：

- `SkyTiptap`
- `Toolbar`
- `ToolbarButton`
- `BubbleMenu`
- `InsertMenuNew`
- `CodeBlock`
- `icons`
- `getIcon`
- `Icon`
- `TipTapPlugin`
- `defaultToolbarConfig`
- `defaultBubbleMenuConfig`
- `emitter`
- `CustomParagraph`
- `VideoEmbed`
- `Iframe`
- `editorRef`
- `insertImage`
- `insertImages`
- `insertVideo`
- `insertVideos`
- `getContent`

兼容说明：

- `window.skyTiptapEditor` 仅用于兼容工具函数。
- 新代码推荐通过组件 `ref` 调用 `SkyTiptap` 暴露的方法。
- 不再维护重复组件导出名。

### 3.5 文档同步

已同步：

- `README.md`
- `agent_readme.md`
- `TEST_REPORT.md`
- `CLEANUP_OPTIMIZATION.md`
- VitePress `docs/`
- `.agent-rules/`
- 桥接入口 `AGENTS.md`、`CLAUDE.md`、`.trae/rules/agent-readme.md`

同步后的共同事实：

- 当前版本为 `1.7.0`。
- 当前测试结果为 13 个测试文件、106 个用例通过。
- 当前构建产物为 ES 与 UMD。
- 当前主线是 `SkyTiptap.vue`、`default.js`、`main.js`、`demo.js`、`ai.js`、`ai-actions.js`、`ai-intent.js`、`emitter.js`、`styles/`、`extensions/`。

---

## 4. 当前仍需关注

### 4.1 包体积

当前构建结果：

| 文件 | 大小 | gzip |
|------|------|------|
| `dist/sky-tiptap.es.js` | 1055.07 kB | 300.43 kB |
| `dist/sky-tiptap.umd.js` | 699.96 kB | 233.74 kB |
| `dist/sky-tiptap.css` | 26.70 kB | 4.36 kB |

后续可选优化：

- 继续减少默认高亮语言数量。
- 评估表格、视频、AI 能力是否拆成可选入口。
- 提供更轻量的基础编辑器构建。

### 4.2 依赖安全

发布前应执行：

```bash
npm audit
```

依赖安全结论应以当前命令输出为准，不沿用旧报告中的漏洞数量。

### 4.3 图标渲染

当前部分图标通过 `v-html` 渲染仓库内静态 SVG 字符串。该方式在当前输入来源下可控；如果未来允许外部图标输入，应改为组件化渲染或净化 SVG。

### 4.4 兼容 API 治理

当前仍保留 `window.skyTiptapEditor` 和基于它的工具函数。后续如需进一步收束 API，应先明确迁移周期，并在 README、VitePress API 文档和 CHANGELOG 中同步说明。

---

## 5. 后续维护规则

新增或修改功能时，应优先落在当前主线：

- `src/components/SkyTiptap.vue`
- `src/config/default.js`
- `src/extensions/`
- `src/utils/ai.js`
- `src/utils/ai-actions.js`
- `src/utils/ai-intent.js`
- `src/utils/emitter.js`
- `src/styles/`

文档或发布相关变更时，应同步检查：

- `package.json`
- `CHANGELOG.md`
- `README.md`
- `agent_readme.md`
- `TEST_REPORT.md`
- `docs/`
- `.agent-rules/`

验证建议：

- 组件、逻辑、入口、扩展变更：运行 `npm test`。
- 构建、导出、发布相关变更：运行 `npm run build`。
- 文档变更：至少检查版本、路径、命令和公共 API 描述是否一致。

---

## 6. 当前验收状态

| 验收项 | 状态 |
|--------|------|
| 库入口不挂载 demo | 已完成 |
| 示例入口独立 | 已完成 |
| 默认配置单一来源 | 已完成 |
| SSR 顶层副作用清理 | 已完成 |
| 公共组件导出收束 | 已完成 |
| 文档版本一致 | 已完成 |
| 项目结构说明与实际目录一致 | 已完成 |
| 安装、使用、发布说明自洽 | 已完成 |
| 单元测试通过 | 已完成，106/106 |
| 构建通过 | 已完成 |
| 包体积进一步优化 | 后续可选 |
| 依赖安全复核 | 发布前执行 |

---

## 7. 结论

当前仓库已经完成主要历史结构收束，可以按 `1.7.0` 的项目基线继续开发。

后续工作重点不再是清理旧入口，而是：

- 持续控制包体积。
- 发布前复核依赖安全。
- 保持兼容 API 与推荐 API 的文档边界清晰。
- 新能力进入当前主线目录，避免重新产生并行实现。
