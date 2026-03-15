# Sky Tiptap - Agent README

## 项目概述

**Sky Tiptap** 是一款基于 Tiptap 和 Vue3 的富文本编辑器组件，提供开箱即用的编辑体验和丰富的扩展功能。

- **包名：** `@Chelase/sky-tiptap`
- **版本：** 1.1.1
- **技术栈：** Vue3 + Tiptap + Vite
- **作者：** Chelsea

---

## 核心功能

### 1. 基础编辑功能
- 粗体、斜体、删除线
- 标题（H1-H3）
- 无序列表、有序列表
- 代码块（支持语法高亮）
- 文本高亮
- 排版优化（Typography）

### 2. 多媒体嵌入
- **图片上传** - 通过 `@uploadPhoto` 事件处理
- **YouTube 视频** - 支持链接嵌入
- **Bilibili 视频** - 支持 BV 号解析嵌入
- **抖音/TikTok 视频** - 支持链接嵌入
- **网页 iframe** - 支持嵌入任意网站

### 3. AI 功能
- **AI 生成内容** - 集成 Sky-AI 流式响应
- 支持 Markdown 渲染
- 实时内容追加

### 4. 交互组件
- **悬浮菜单 (Bubble Menu)** - 选中文本时显示格式化工具
- **插入菜单 (Insert Menu)** - 快速插入多媒体内容
- **工具栏 (Toolbar)** - 可配置的按钮组
- **提示框 (Tooltip)** - 按钮悬停提示

---

## 项目结构

```
sky-tiptap/
├── src/
│   ├── index.vue              # 主入口组件
│   ├── main.js                # 编辑器实例管理
│   ├── App.vue                # 示例应用
│   ├── components/
│   │   ├── SkyTiptap.vue      # 核心编辑器组件
│   │   ├── BubbleMenu/        # 悬浮菜单
│   │   ├── Toolbar/           # 工具栏组件
│   │   ├── InsertMenu.vue     # 插入菜单
│   │   ├── CodeBlock.vue      # 代码块视图
│   │   └── tooltip.vue        # 提示组件
│   ├── config/
│   │   └── default.js         # 默认配置
│   ├── extensions/            # 自定义扩展
│   │   ├── CustomParagraph.js
│   │   ├── iframe.js
│   │   └── web-video.js
│   ├── utils/
│   │   ├── index.js           # 工具函数
│   │   ├── emitter.js         # 事件总线
│   │   └── extensions/        # 扩展工具
│   ├── icons/
│   │   └── index.js           # 图标管理
│   ├── assets/svg/            # SVG 图标
│   └── styles/                # 样式文件
├── dist/                      # 构建输出
├── package.json
└── vite.config.js
```

---

## 快速开始

### 安装

```bash
npm install @Chelase/sky-tiptap
```

### 基础使用

```vue
<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
  />
</template>

<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()
const content = ref('')
</script>
```

---

## API 参考

### 组件 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | String | `''` | 双向绑定的内容 |
| `fileName` | String | `'file'` | 上传文件的默认名称 |

### 组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | String | 内容变化时触发 |
| `uploadPhoto` | File | 图片上传时触发 |

### 导出工具函数

```javascript
import { insertImage, getContent } from '@Chelase/sky-tiptap'

// 插入图片
insertImage('https://example.com/image.png')

// 获取编辑器内容
const html = getContent()
```

---

## 扩展开发

### 自定义扩展

项目支持通过 `extensions/` 目录添加自定义 Tiptap 扩展：

```javascript
// src/extensions/CustomParagraph.js
import { Extension } from '@tiptap/core'

export const CustomParagraph = Extension.create({
  name: 'customParagraph',
  // 扩展实现
})
```

### 配置插件

在 `src/config/default.js` 中配置默认插件：

```javascript
export const TipTapPlugin = {
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    // 添加自定义扩展
  ],
  // 其他配置
}
```

---

## 构建与发布

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
# 自动清理 dist/assets 目录
```

### 发布

```bash
npm publish
# 发布到 GitHub Packages
```

### 版本管理

```bash
npm version patch  # 或 minor/major
# 自动生成 CHANGELOG
```

---

## 技术细节

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@tiptap/vue-3` | ^2.27.2 | Vue3 编辑器核心 |
| `@tiptap/starter-kit` | ^2.27.2 | 基础扩展包 |
| `@tiptap/extension-*` | ^2.27.2 | 官方扩展 |
| `vue` | ^3.5.30 | Vue3 框架 |
| `vite` | ^6.4.1 | 构建工具 |
| `lowlight` | ^3.3.0 | 语法高亮 |
| `markdown-it` | ^14.1.0 | Markdown 渲染 |
| `mitt` | ^3.0.1 | 事件总线 |

### 事件总线

使用 `mitt` 实现组件间通信：

```javascript
import { emitter } from './utils/emitter'

// 触发事件
emitter.emit('trigger-add-image')

// 监听事件
emitter.on('trigger-add-image', handler)
```

---

## 注意事项

1. **Node 版本要求：** >= 18.0.0
2. **NPM 版本要求：** >= 10.0.0
3. **发布配置：** 默认发布到 GitHub Packages
4. **构建输出：** UMD + ES Module 双格式

---

## 许可证

MIT License

---

*最后更新：2026-03-15*
