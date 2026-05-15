# AGENTS.md

本仓库的项目级 agent 规则统一收敛在 `.agent-rules/` 目录。

## 必须先读取的文件

任何 agent 在本仓库执行分析、编辑、测试、提交准备之前，至少应读取：

- `.agent-rules/README.md`
- `.agent-rules/development.md`
- `.agent-rules/release-docs.md`（当任务涉及版本、文档、提交、发布时）

按任务需要继续读取：

- `README.md`
- `agent_readme.md`

## 规则来源与优先级

- `.agent-rules/` 是唯一的项目规则真来源。
- `CLAUDE.md`、`.trae/rules/agent-readme.md` 仅作为桥接入口，不应各自维护一套独立的项目规则。
- 若规则冲突，优先级为：系统/宿主工具指令 > 用户要求 > `.agent-rules/` > 桥接文件 > 其他项目文档。

## 最低工作要求

- 保持手术式改动，不做无关重构。
- 优先沿当前主线实现工作：`src/components/SkyTiptap.vue`、`src/config/default.js`、`src/extensions/`、`src/utils/ai.js`、`src/utils/ai-actions.js`、`src/utils/ai-intent.js`、`src/utils/emitter.js`、`src/styles/`。
- `src/index.vue` 和 `src/utils/index.js` 已删除，不再作为开发入口；新增样式进入 `src/styles/`，不要继续扩展 `src/style/`。
- 当改动影响已发布行为、对外 API、项目结构或安装方式时，必须同步检查版本和文档。
