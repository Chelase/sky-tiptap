# Sky Tiptap 事件 API 补齐计划

## 已完成事件

| 事件 | 说明 |
|------|------|
| `update:modelValue` | 内容变化 |
| `uploadPhoto` | 选择图片，返回 File[] |
| `uploadVideo` | 选择视频，返回 File[] |
| `paste` | 粘贴内容时触发，可拦截图片等文件粘贴 |
| `drop` | 拖放文件到编辑器时触发 |
| `ready` | 编辑器初始化完成 |
| `focus` / `blur` | 获得/失去焦点 |
| `selectionChange` | 选区变化时触发，返回选区范围和选中文本 |
| `linkClick` | 点击链接时触发，允许自定义跳转行为 |
| `beforeChange` | 内容即将变化时触发，可以阻止变化 |

## 需求清单

### P0 - 粘贴处理事件（已完成）

用户复制图片粘贴到编辑器，图片会变成 base64，导致内容体积暴增、数据库查询变慢。

需要 `paste` 事件，让使用者拦截粘贴的图片，上传到服务器后用 URL 替换 base64。

```vue
<sky-tiptap @paste="handlePaste" />
```

### P1 - 编辑器生命周期事件（已完成）

- `ready` - 编辑器初始化完成
- `focus` / `blur` - 获得/失去焦点

### P1 - 选区变化事件（已完成）

- `selectionChange` - 选区变化时触发，返回选区范围和选中文本

### P2 - 拖放处理事件（已完成）

- `drop` - 用户拖放文件到编辑器时触发，与 paste 类似，允许拦截处理

### P2 - 链接点击事件（已完成）

- `linkClick` - 点击链接时触发，允许自定义跳转行为

### P2 - 内容变化拦截（已完成）

- `beforeChange` - 内容即将变化时触发，可以阻止变化

---

## 元素拖拽功能

编辑器内容区块（段落、图片、表格等）的拖拽排序。

Tiptap 官方有免费开源的拖拽插件（MIT 协议）：

- `@tiptap/extension-drag-handle` - 拖拽手柄
- `@tiptap/extension-drag-handle-vue-3` - Vue 3 适配
- `@tiptap/extension-dropcursor` - 拖拽位置指示光标
- `@tiptap/extension-node-range` - 多节点选择

社区方案：`tiptap-extension-global-drag-handle`（类似 Notion 的悬浮拖拽手柄）

集成官方插件即可，不需要自己开发。

---

## 插件开源计划

后续计划将项目中开发的扩展插件独立发布为 Tiptap 插件，开源到 GitHub 和 npm：

- 视频嵌入插件（B 站、YouTube、抖音）
- iframe 嵌入插件
- AI 加载骨架屏插件
- 自定义段落插件

---

*创建日期：2026-05-16*
