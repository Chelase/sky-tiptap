# Sky Tiptap 清理、保留与插件替换建议

本文档用于记录当前项目中哪些代码建议删除、哪些能力建议保留自定义实现，以及哪些功能可以迁移到 Tiptap 官方免费插件。

## 1. 建议删除

### `src/utils/extensions/` 下的历史扩展

当前项目已经以 `src/extensions/` 作为自定义扩展主目录，`src/config/default.js` 实际引用的也是该目录下的扩展。

以下文件属于历史残留或重复实现，建议删除：

- `src/utils/extensions/web-video.js`
- `src/utils/extensions/iframe.js`
- `src/utils/extensions/CustomParagraph.js`

删除原因：

- 不在当前主线配置中使用
- 与 `src/extensions/` 下的实现重复
- 容易让后续维护者误以为项目存在两套扩展入口

## 2. 建议保留

### `src/extensions/web-video.js`

建议保留。

原因是当前视频扩展不只是处理 YouTube，还处理：

- Bilibili
- YouTube
- 抖音 / TikTok
- 已上传视频 URL

Tiptap 官方有 YouTube 扩展，但没有 Bilibili 和抖音扩展。这个文件仍然是项目差异化能力的一部分。

### `src/extensions/iframe.js`

建议保留。

Tiptap 官方目前没有稳定发布的 iframe 扩展包。iframe 嵌入是项目当前功能之一，继续维护自定义实现更合适。

### `src/extensions/ai-loading.js`

建议保留。

这是 Sky Tiptap 自己的 AI 生成加载态节点，用于在编辑器中展示 AI 生成中的占位效果。它属于项目自己的交互设计，官方插件无法直接替换。

### `src/extensions/CustomParagraph.js`

建议保留。

它承载了段落旁边的插入按钮交互，是当前编辑器风格的一部分。Tiptap 官方没有对应的完整 UI 插件。

### `src/extensions/before-change.js`

建议保留。

这是 Sky Tiptap 为 `beforeChange` 组件事件提供的内部扩展，基于 ProseMirror `filterTransaction` 在内容变化应用前同步抛出事件，并允许业务侧通过 `preventDefault()` 阻止本次 transaction。

它解决的是项目级事件 API 和业务拦截能力，不是具体节点、Mark 或菜单 UI。Tiptap 官方没有可直接替换该事件契约的免费插件，继续保留内部实现更合适。

## 3. 可以考虑替换或补强

### YouTube 视频

当前项目在 `web-video.js` 中自己处理 YouTube 链接解析和 iframe 生成。

可以考虑使用官方免费插件：

- `@tiptap/extension-youtube`

建议：

- 如果希望减少自定义代码，可以把 YouTube 逻辑交给官方插件
- Bilibili、抖音、已上传视频仍然保留在自定义 `web-video.js` 中

### 粘贴和拖放文件处理

当前项目需要补齐粘贴图片处理事件，避免复制图片后直接插入 base64。

可以考虑接入官方免费插件：

- `@tiptap/extension-file-handler`

用途：

- 处理 paste 中的文件
- 处理 drop 中的文件
- 将图片、视频等文件交给业务侧上传

注意：

- 这是文件 paste/drop 处理能力
- Tiptap Pro 的 `@tiptap-pro/extension-paste-handler` 是另一类插件，主要处理 Word、Excel、Google Docs 等复杂 HTML 粘贴转换，不是同一个东西

### 元素拖拽排序

已接入官方免费插件：

- `@tiptap/extension-drag-handle`
- `@tiptap/extension-drag-handle-vue-3`
- `@tiptap/extension-dropcursor`
- `@tiptap/extension-node-range`

当前用途：

- 给段落、图片、表格等块级内容添加拖拽手柄
- 支持内容区块拖拽排序
- 显示拖放位置提示

说明：

- 这些插件当前是免费开源的 MIT 协议
- `@tiptap/extension-node-range` 已显式列入运行依赖，用于 drag-handle 的节点范围选择
- 后续如需继续接近 Notion / 少数派编辑器体验，可继续优化手柄显示策略和真实拖拽手测细节

### Placeholder

已接入官方免费插件：

- `@tiptap/extension-placeholder`

用途：

- 显示空编辑器占位文本
- 支持不同节点的占位提示

当前项目按组件实例的 `placeholder` prop 配置该扩展，避免多个编辑器实例共享固定占位文本。

## 4. 已经使用官方插件的能力

以下能力已经使用 Tiptap 官方免费插件，暂时不需要替换：

| 功能 | 当前插件 |
|------|----------|
| 基础编辑能力 | `@tiptap/starter-kit` |
| 图片 | `@tiptap/extension-image` |
| 链接 | `@tiptap/extension-link` |
| 表格 | `@tiptap/extension-table`、`@tiptap/extension-table-row`、`@tiptap/extension-table-cell`、`@tiptap/extension-table-header` |
| 代码块高亮 | `@tiptap/extension-code-block-lowlight` |
| 文本高亮 | `@tiptap/extension-highlight` |
| 下划线 | `@tiptap/extension-underline` |
| Typography | `@tiptap/extension-typography` |

## 5. 不建议替换成 Pinia

当前事件总线主要用于编辑器内部组件通信，例如：

- 打开统一弹窗
- 触发图片/视频选择
- 打开 Bilibili、YouTube、抖音、iframe 输入弹窗
- 打开 AI 输入弹窗
- 控制插入菜单显示和隐藏

这些通信都发生在 Sky Tiptap 组件内部，不是应用级全局状态。

因此不建议用 Pinia 替换 `mitt`。

更合适的方向是：

- 短期继续保留 `mitt`
- 中期逐步改成 `provide/inject` 或内部 reactive store
- 不把 Pinia 作为组件库的运行依赖

## 6. 后续可独立发布的插件

后续如果要将项目中的能力拆成独立 Tiptap 插件，可以优先考虑：

- Bilibili / 抖音 / 多平台视频嵌入插件
- iframe 嵌入插件
- AI loading 节点插件
- 自定义段落插入按钮插件
- beforeChange 内容变化前拦截插件

这些插件可以单独开源到 GitHub，并发布到 npm，作为 Sky Tiptap 之外也可复用的 Tiptap 扩展。
