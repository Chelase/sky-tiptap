# Sky Tiptap 版本、文档与发布规范

## 1. 版本与文档同步

当改动会影响已发布包的行为、外部 API、安装方式、公共用法或项目结构说明时，必须检查以下文件是否需要同步：

- `package.json`
- `CHANGELOG.md`
- `README.md`
- `agent_readme.md`
- `.agent-rules/` 下的规则文件

同步原则：

- 版本号以 `package.json` 为准
- 更新版本时必须同步 `CHANGELOG.md`
- 对外使用方式变更时必须同步 `README.md`
- 组件结构、模块职责或开发规范变更时必须同步 `agent_readme.md` 或 `.agent-rules/`

## 2. 何时需要升级版本号

采用语义化版本号（SemVer）：

- `MAJOR`：不兼容的外部 API 变更
- `MINOR`：向下兼容的功能新增
- `PATCH`：向下兼容的行为修复

默认判断规则：

- 新增功能、对外能力、扩展或组件：通常需要 `MINOR`
- 修复已发布包中的用户可感知问题：通常需要 `PATCH`
- 仅文档、测试、内部重构、清理、样式微调且不影响对外行为：通常不需要升级版本号，除非用户明确要求发版

## 3. 提交前的检查顺序

当用户表达“准备提交代码”或要求生成 commit 内容时，应先做这些检查，再组织提交信息：

1. 本次改动是否影响已发布包的对外行为
2. 是否需要升级版本号
3. 是否需要同步 `CHANGELOG.md`
4. 是否需要同步 `README.md`、`agent_readme.md`、`.agent-rules/`
5. 是否需要补充最基本的验证结果

在这些同步动作完成之前，不要先生成最终 commit 信息。

## 4. 提交信息建议

提交信息可遵循以下格式：

```text
<type>(<scope>): <subject>
```

常用 `type`：

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `test`
- `chore`

生成提交建议时，应包含：

- 涉及文件
- 修改内容摘要
- 是否包含版本与文档同步

如果用户要求真正执行提交，仍需在执行前征求确认。

## 5. 当前发布流程

根据 `.github/workflows/publish.yml`，当前自动发布流程如下：

- 触发条件：推送到 `master` 分支
- 运行环境：GitHub Actions + Node.js 20
- 主要步骤：
  - `npm ci`
  - `npm run build`
  - 发布到 GitHub Packages
  - 临时把包名从 `@Chelase/sky-tiptap` 改为 `sky-tiptap`
  - 发布到 npm
  - 恢复 `package.json`

所需 secrets：

- `GH_PACKAGES_TOKEN`
- `NPM_TOKEN`

如果发布策略、包名或安装方式发生变化，必须同步修正相关文档和规则。

## 6. 安装说明与发布目标必须一致

安装文档不能只写“如何装”，还要与真实发布目标一致：

- 如果包主要从 GitHub Packages 获取，文档应说明 registry 配置
- 如果包主要从 npm 获取，文档应说明最终实际包名
- 如果同时维护两个发布目标，文档应明确两者的差异，避免用户误装

这是发布规范的一部分，不是可选补充说明。
