# Sky Tiptap 优化计划

本文档记录 Sky Tiptap 后续优化方向。目标不是大规模重写，而是在保持当前可用性的前提下，逐步清理历史代码、补齐事件 API、减少自定义实现，并为后续插件化做准备。

## 优化目标

- 保持编辑器轻量、现代、易接入
- 减少历史残留和重复实现
- 补齐编辑器组件应有的事件 API
- 优先使用 Tiptap 官方免费插件
- 保留项目差异化能力，例如 AI 操控、多平台视频嵌入、自定义段落交互
- 为后续拆分独立 Tiptap 插件做准备

## 第一阶段：清理历史代码

优先级：高

### 任务

- 删除 `src/utils/extensions/` 下的历史扩展文件
- 检查是否还有文档引用旧目录
- 确认 `src/extensions/` 是唯一自定义扩展目录

### 涉及文件

- `src/utils/extensions/web-video.js`
- `src/utils/extensions/iframe.js`
- `src/utils/extensions/CustomParagraph.js`
- `agent_readme.md`
- `.agent-rules/README.md`
- `.agent-rules/development.md`

### 验证

- 运行测试
- 运行构建
- 确认文档中不再出现旧扩展目录作为主线入口

## 第二阶段：补齐事件 API

优先级：高

### 任务

已补齐以下事件：

- `paste`：粘贴内容处理，重点解决图片 base64 问题
- `drop`：拖放文件处理
- `ready`：编辑器初始化完成
- `focus` / `blur`：焦点变化
- `selectionChange`：选区变化
- `linkClick`：链接点击
- `beforeChange`：内容即将变化时触发，可通过 `preventDefault()` 阻止本次内容变更

### 重点场景

用户复制图片后粘贴到编辑器时，不应默认把图片转成 base64 存入内容。业务侧应该可以拦截粘贴事件，将图片上传到自己的服务器，再把 URL 插入编辑器。

### 可评估插件

- `@tiptap/extension-file-handler`

### 验证

- 粘贴图片可以被业务侧拦截
- 拦截后不产生 base64 内容
- 上传完成后可通过 URL 插入图片
- 文档补充事件用法

## 第三阶段：接入元素拖拽能力（已执行）

优先级：中

### 任务

为编辑器块级内容添加拖拽排序能力。

### 已接入插件

- `@tiptap/extension-drag-handle`
- `@tiptap/extension-drag-handle-vue-3`
- `@tiptap/extension-dropcursor`
- `@tiptap/extension-node-range`

### 已完成体验

- 段落、标题、图片、视频、iframe、表格、代码块等块级元素可以拖拽排序
- 存在多个可拖拽顶层区块时显示左侧拖拽手柄
- 拖拽时通过 Dropcursor 显示主题色落点提示
- 手柄外层容器和视觉按钮样式已拆分，避免定位层与按钮样式混用

### 验证状态

- 已补充 `SkyTiptap.test.js` 覆盖拖拽手柄配置、多编辑器实例、图片/视频/iframe/表格块属性和外部内容变化刷新
- 仍建议在浏览器中做一次真实拖拽手测，确认实际鼠标拖拽顺序变更和落点视觉符合预期

## 第四阶段：减少可替代的自定义实现

优先级：中

### 任务

- 评估是否用 `@tiptap/extension-youtube` 替换当前自定义 YouTube 逻辑
- 评估是否接入 `@tiptap/extension-placeholder`
- 保留 Bilibili、抖音、iframe、AI loading、自定义段落等项目特有实现

### 注意

替换官方插件不是为了追求“官方”本身，而是为了减少维护成本。只在官方插件能覆盖当前体验且不会增加复杂度时替换。

## 第五阶段：梳理内部通信机制

优先级：中低

### 当前情况

项目目前使用 `mitt` 做内部事件通信。

它主要用于：

- 子组件触发统一弹窗
- 子组件通知主组件打开文件选择器
- 工具栏、插入菜单、自定义段落之间通信

### 推荐方向

- 短期保留 `mitt`
- 不引入 Pinia
- 后续可以将部分事件改为 `provide/inject` 或内部 reactive store

### 不建议使用 Pinia 的原因

- 当前通信是组件库内部通信，不是应用级全局状态
- Pinia 会增加额外依赖和接入成本
- 对使用者来说，组件库不应该强依赖应用级状态管理方案

## 第六阶段：插件化和独立发布

优先级：低

### 目标

将项目中通用性较强的扩展拆成独立 Tiptap 插件，开源发布到 GitHub 和 npm。

### 候选插件

- 多平台视频嵌入插件
- iframe 嵌入插件
- AI loading 节点插件
- 自定义段落插入按钮插件

### 发布前要求

- 每个插件有独立 README
- 有基本使用示例
- 有最小测试覆盖
- 明确支持的 Tiptap 版本
- 明确许可证

## 推荐执行顺序

1. 清理 `src/utils/extensions/` 历史代码
2. 实现 `paste` / `drop` 事件，解决 base64 图片问题
3. 补齐 `ready`、`focus`、`blur`、`selectionChange`
4. 补齐 `linkClick` 链接点击事件
5. 补齐 `beforeChange` 内容变化前拦截事件
6. 接入拖拽排序能力
7. 评估 `@tiptap/extension-file-handler`、YouTube、placeholder 等官方插件替换
8. 逐步拆分 `SkyTiptap.vue` 中的 AI 和文件处理逻辑
9. 准备独立插件开源发布
