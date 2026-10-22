# 组件配置

## SkyTiptap

主编辑器组件。

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `String` | `''` | 双向绑定的内容，支持 `v-model` |
| `theme` | `String` | `'default'` | 主题，可选值：`default`、`dark` |
| `showToolbar` | `Boolean` | `false` | 是否显示顶部工具栏 |
| `placeholder` | `String` | `'输入内容...'` | 空编辑器占位符文本，通过官方 Placeholder 扩展渲染 |
| `aiConfig` | `Object` | `{ baseUrl: '', apiKey: '' }` | AI 配置，支持内容生成、`mode: 'actions'` 操控编辑器模式、执行前预览、只预览不执行和失败回滚；请求侧支持 `requestBody`、`buildBody`、`buildRequest`、`headers`、`method`、`parseResponse` 和 `stream` |
| `insertMenuItems` | `Array` | 内置块目录 | 块插入菜单（「+」按钮 / `⌘/`）的块目录，支持 `{ type, label, icon, group, keywords }` |

## 块级交互

编辑器提供 Notion 风格的块级操作：hover 任意顶层块时，左侧会出现「+」按钮，点击打开可搜索的块插入菜单；`Alt/Option` + 点击可直接在该块上方插入空块。

| 快捷键 | 行为 |
|------|------|
| `⌘/Ctrl + /` | 打开块插入菜单 |
| `⌘/Ctrl + Shift + ↑/↓` | 上移 / 下移当前块 |
| `⌘/Ctrl + D` | 复制当前块 |
| `Esc` | 选中当前块 |
| `⌘/Ctrl + B/I/U` | 加粗 / 斜体 / 下划线 |
| `⌘/Ctrl + Shift + H` | 高亮 |
| `⌘/Ctrl + K` | 设置链接 |

## aiConfig 基础配置

```javascript
{
  baseUrl: 'https://your-ai-api.com/generate',
  apiKey: 'your-api-key',
  stream: true,
}
```

更完整的 AI 配置见：[AI API](/api/ai)。
