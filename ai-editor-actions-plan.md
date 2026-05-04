# AI 操控编辑器功能实施计划

## 目标

在现有 `aiConfig` 通用 AI 调用能力基础上，新增“AI 操控编辑器”能力。AI 不直接操作 DOM，也不执行任意 JavaScript，而是返回受控的结构化 actions，由 `sky-tiptap` 内部白名单执行 Tiptap command。

目标效果：

- 用户输入自然语言需求，例如“插入一个三列表格，并加一个二级标题”。
- AI 返回结构化 JSON actions。
- 编辑器按 actions 调用内部能力，例如标题、表格、代码块、链接、图片、视频、iframe 等。
- 所有动作都必须经过白名单、参数校验和测试覆盖。

## 核心原则

- 不使用 DOM 点击模拟作为核心能力。
- 不让 AI 执行任意代码。
- 不把具体模型协议写死在编辑器内部。
- 保持现有 `aiConfig` 的通用请求设计。
- AI 只负责生成结构化意图，编辑器只执行可控动作。
- 先实现最小闭环，再扩展完整能力。

## 推荐架构

```text
用户输入
  ↓
SkyDialog 输入提示词
  ↓
aiConfig 调用外部 AI API
  ↓
AI 返回 JSON actions
  ↓
parseAiActions 解析与校验
  ↓
executeAiActions 白名单执行
  ↓
Tiptap editor.chain() 修改文档
```

## 计划新增模块

### `src/utils/ai-actions.js`

职责：

- 定义 AI action 类型。
- 从 AI 返回文本中提取 JSON。
- 校验 action 结构和参数。
- 将 action 映射到 Tiptap command。
- 返回执行结果或错误信息。

建议导出：

```js
export const parseAiActionResponse = (responseText) => {}
export const normalizeAiActions = (payload) => {}
export const executeAiAction = (editor, action) => {}
export const executeAiActions = (editor, actions) => {}
```

### `src/__tests__/ai-actions.test.js`

职责：

- 覆盖 JSON 提取。
- 覆盖 action 校验。
- 覆盖每个 action 的执行映射。
- 覆盖非法 action 被拒绝。
- 覆盖部分执行失败时的错误处理。

## AI 返回格式

### 内容生成模式

保留当前 Markdown 内容生成能力：

```json
{
  "mode": "content",
  "markdown": "## 标题\n\n正文内容"
}
```

### 编辑器动作模式

新增 actions 模式：

```json
{
  "mode": "actions",
  "actions": [
    {
      "type": "setHeading",
      "params": {
        "level": 2,
        "text": "项目计划"
      }
    },
    {
      "type": "insertTable",
      "params": {
        "rows": 3,
        "cols": 4,
        "withHeaderRow": true
      }
    }
  ]
}
```

### 混合模式

可选扩展，不建议第一阶段实现：

```json
{
  "mode": "mixed",
  "actions": [
    {
      "type": "insertMarkdown",
      "params": {
        "markdown": "## 说明\n\n下面是表格。"
      }
    },
    {
      "type": "insertTable",
      "params": {
        "rows": 3,
        "cols": 3
      }
    }
  ]
}
```

## 第一阶段最小闭环

先实现 4 个动作，验证架构可行：

| Action | 说明 | Tiptap 映射 |
|---|---|---|
| `insertMarkdown` | 插入 Markdown 内容 | `renderMarkdown` + `insertContent` |
| `setHeading` | 插入或切换标题 | `insertContent` / `toggleHeading` |
| `insertTable` | 插入表格 | `insertTable({ rows, cols, withHeaderRow })` |
| `insertCodeBlock` | 插入代码块 | `insertContent({ type: 'codeBlock' })` |

第一阶段验收标准：

- AI 能返回 JSON actions。
- 编辑器能执行这 4 个 action。
- 非法 action 不执行并给出错误提示。
- 每个 action 有单元测试。
- 当前 Markdown 生成能力不回归。

## 第二阶段扩展动作

补齐当前项目已有编辑器能力：

| Action | 参数建议 | 说明 |
|---|---|---|
| `toggleBulletList` | 无 | 无序列表 |
| `toggleOrderedList` | 无 | 有序列表 |
| `setLink` | `{ href, text? }` | 添加链接 |
| `unsetLink` | 无 | 移除链接 |
| `insertDivider` | 无 | 分割线 |
| `insertImage` | `{ src, alt? }` | 插入图片 URL |
| `insertUploadedVideo` | `{ src }` | 插入上传视频 URL |
| `insertBilibiliVideo` | `{ src }` | 插入 Bilibili 视频 |
| `insertYoutubeVideo` | `{ src }` | 插入 YouTube 视频 |
| `insertDouyinVideo` | `{ src }` | 插入抖音视频 |
| `insertIframe` | `{ src }` | 嵌入网站 |

## 第三阶段交互优化

可选增强：

- AI 操作前展示 actions 预览，让用户确认。
- 支持“仅预览不执行”模式。
- 支持逐步执行和失败回滚。
- 对危险动作增加确认，例如清空内容、批量替换。
- 支持执行结果摘要，例如“已插入标题和 3x4 表格”。

## 与现有 AI 生成能力的关系

当前能力：

- `aiConfig` 负责调用外部 AI。
- AI 返回 Markdown。
- 编辑器渲染 Markdown 并插入。
- 支持 `stream: true` 流式 Markdown。

新增能力：

- `aiConfig` 仍负责调用外部 AI。
- AI 返回 JSON actions。
- 编辑器执行白名单 actions。

建议通过新增配置区分：

```js
const aiConfig = {
  baseUrl: '...',
  apiKey: '...',
  mode: 'content', // 默认
}
```

动作模式：

```js
const aiConfig = {
  baseUrl: '...',
  apiKey: '...',
  mode: 'actions',
  buildBody: (prompt) => ({
    model: 'gpt-5.2',
    input: [
      {
        type: 'message',
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: '你只能返回 JSON，不要返回解释。'
          }
        ]
      },
      {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt
          }
        ]
      }
    ],
    stream: false
  })
}
```

## Prompt 约束建议

系统提示词应由使用方或库内 helper 生成，核心约束如下：

```text
你是 sky-tiptap 编辑器的动作生成器。
你必须只返回 JSON。
不要返回 Markdown，不要返回解释。
只允许返回 mode 和 actions 字段。
actions 中 type 必须来自允许列表。
参数必须符合 schema。
无法完成时返回：
{
  "mode": "actions",
  "actions": [],
  "message": "无法完成原因"
}
```

## 安全策略

- 只允许白名单 action。
- 不执行 AI 返回的函数、脚本、事件字符串。
- URL 类参数只传给已有安全路径，必要时校验协议为 `http:` / `https:`。
- 表格行列限制上限，例如 `rows <= 20`、`cols <= 10`。
- 代码块只插入文本，不执行代码。
- 图片、视频、iframe 只插入 URL，不主动请求上传。

## 错误处理

错误类型：

- AI 请求失败。
- AI 返回非 JSON。
- JSON 格式不符合 actions schema。
- action type 不在白名单。
- 参数缺失或越界。
- Tiptap command 执行失败。

交互建议：

- 使用现有 `SkyDialog` 展示错误。
- 错误文案要告诉用户“AI 返回的操作格式不正确”或“该操作暂不支持”。
- 不执行部分可信、部分不可信的混合 actions，第一阶段建议整体失败。

## 测试计划

新增：

- `src/__tests__/ai-actions.test.js`

覆盖：

- `parseAiActionResponse` 能解析纯 JSON。
- `parseAiActionResponse` 能从 Markdown code fence 中提取 JSON。
- 非 JSON 返回抛错。
- 未知 action 被拒绝。
- `insertMarkdown` 调用 Markdown 渲染并插入。
- `setHeading` 参数 level 限制为 1、2、3。
- `insertTable` 限制 rows / cols 上限。
- `insertCodeBlock` 插入代码块节点。
- 多 actions 顺序执行。
- 任一 action 非法时不执行。

更新：

- `SkyTiptap.test.js` 增加 actions 模式集成测试。
- `README.md` 增加 AI 操控编辑器说明。
- `agent_readme.md` 同步 AI 能力结构。
- `CHANGELOG.md` 在正式实现时同步版本和变更。

## 明天执行顺序

1. 新建 `src/utils/ai-actions.js`。
2. 实现 JSON 提取和 schema 校验。
3. 实现第一阶段 4 个 action。
4. 在 `SkyTiptap.vue` 中接入 `aiConfig.mode === 'actions'` 分支。
5. 保持 `content` 模式完全兼容现有 AI Markdown 生成。
6. 新增 `ai-actions.test.js`。
7. 更新 `SkyTiptap.test.js`。
8. 运行相关测试。
9. 更新 README、agent_readme、CHANGELOG。
10. 跑全量测试和构建。

## 暂不做

- 不引入 MCP。
- 不引入 page-agent 作为内部核心依赖。
- 不做 DOM 点击模拟。
- 不做任意 JS 执行。
- 不做复杂回滚系统。
- 不做全部 action 一次性铺满，先完成最小闭环。

