# Sky Tiptap Agent Rules

## 1. 目的

`.agent-rules/` 是本仓库所有项目级 agent 规则的唯一真来源。

以下文件都应视为桥接入口，而不是各自维护一套独立规则：

- `AGENTS.md`
- `CLAUDE.md`
- `.trae/rules/agent-readme.md`

如果这些桥接文件与本目录内容不一致，应以 `.agent-rules/` 为准，并在合适时机修正桥接文件，避免规则漂移。

## 2. 强制读取顺序

任何 agent 在本仓库执行分析、编辑、测试、提交准备之前，至少应按以下顺序读取规则：

1. `.agent-rules/README.md`
2. 根据任务读取对应专题规则：
   - 代码、样式、组件、测试、重构、编辑器配置变更：`.agent-rules/development.md`
   - 版本、文档、提交、发布相关任务：`.agent-rules/release-docs.md`
3. 根据任务再读取相关项目文档：
   - 功能与使用背景：`README.md`
   - 项目结构与模块说明：`agent_readme.md`
   - 测试现状与已知问题：`TEST_REPORT.md`
   - 清理/重构背景：`CLEANUP_OPTIMIZATION.md`

## 3. 规则优先级

规则冲突时，按以下优先级处理：

1. 系统或宿主工具指令
2. 用户当前明确提出的要求
3. `.agent-rules/` 下的规则
4. 桥接文件中的摘要说明
5. 其他旧文档中的历史描述

如果旧文档与 `.agent-rules/` 或当前代码实现不一致，不要继续扩散旧规则；应优先遵守当前有效规则，并在任务允许时同步修正文档。

## 4. 当前项目主线

本仓库当前推荐的主线实现路径是：

- 主编辑器组件：`src/components/SkyTiptap.vue`
- 编辑器默认配置：`src/config/default.js`
- 事件总线：`src/utils/emitter.js`
- 样式目录：`src/styles/`
- 自定义扩展：`src/extensions/`

以下位置视为遗留实现或过渡面，除兼容性任务或显式清理任务外，不应继续扩展主线功能：

- `src/index.vue`
- `src/utils/index.js`
- `src/style/`

## 5. 必须遵守的工作底线

- 改动必须围绕用户请求，保持手术式范围。
- 不要在多个入口重复定义项目规则；项目规则统一收敛到 `.agent-rules/`。
- 新功能优先进入当前主线实现，不要把历史过渡文件继续做成第二条主线。
- 当改动影响对外行为、版本、安装方式或项目结构时，必须同步检查文档和版本规则。
- 当任务涉及版本、提交、发布或文档同步时，必须额外阅读 `.agent-rules/release-docs.md`。
