# 介绍

**Sky Tiptap** 是一款适用于 Vue3 的 Tiptap 富文本编辑器组件，开箱即用、功能丰富。

## 特性

- ✅ 基础编辑（粗体、斜体、下划线、删除线、标题、列表、撤销/重做、代码块）
- ✅ Markdown 快捷输入
- ✅ 图片上传（单图/多图）
- ✅ 视频嵌入（Bilibili、YouTube、抖音/TikTok）
- ✅ 本地视频上传
- ✅ iframe 嵌入
- ✅ 表格插入
- ✅ 链接管理
- ✅ 元素拖拽排序
- ✅ AI 内容生成（支持流式响应）
- ✅ AI 操控编辑器（结构化 actions 白名单执行）
- ✅ 统一弹窗组件（替代原生 prompt/alert）
- ✅ 悬浮菜单（含标题、列表）、插入菜单、工具栏

## 技术栈

- **Vue 3** - 前端框架
- **Tiptap 2.x** - 富文本编辑器核心
- **Vite 6.x** - 构建工具
- **lowlight** - 代码语法高亮
- **highlight.js** - 高亮主题

## 安装

```bash
npm install @Chelase/sky-tiptap
```

或从 npm 公共包安装：

```bash
npm install sky-tiptap
```

## 快速体验

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()
const content = ref('')
</script>

<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
  />
</template>
```

## 版本

当前版本：**1.9.0**

详细更新日志请查看 [CHANGELOG](https://github.com/Chelase/sky-tiptap/blob/master/CHANGELOG.md)
