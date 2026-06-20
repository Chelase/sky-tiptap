# API 概览

Sky Tiptap 的 API 按使用场景拆分为几个部分，方便快速查找。

## 页面导航

| 页面 | 内容 |
|------|------|
| [组件配置](/api/props) | `SkyTiptap` 组件 Props、`aiConfig` 基础配置 |
| [事件](/api/events) | `update:modelValue`、上传、粘贴、拖放、焦点、选区、链接点击和变更前拦截事件 |
| [实例方法](/api/methods) | 通过组件 `ref` 调用的插入、获取、设置方法 |
| [媒体 API](/api/media) | 图片上传、视频上传、手动插入图片/视频 |
| [AI API](/api/ai) | AI 内容生成、AI actions、流式响应和执行控制 |

## 常用入口

### 基础使用

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const content = ref('')
</script>

<template>
  <sky-tiptap v-model="content" />
</template>
```

### 图片上传

```vue
<sky-tiptap
  v-model="content"
  @uploadPhoto="handleUploadPhoto"
/>
```

详见：[媒体 API](/api/media)。

### 粘贴图片处理

```vue
<sky-tiptap
  ref="editor"
  v-model="content"
  @paste="handlePaste"
/>
```

如果业务侧没有在 `paste` 事件中调用 `preventDefault()`，编辑器会继续执行默认粘贴逻辑，剪贴板图片仍可能以 base64 形式进入内容。

详见：[事件](/api/events)。

### AI 内容生成

```vue
<sky-tiptap
  v-model="content"
  :ai-config="aiConfig"
/>
```

详见：[AI API](/api/ai)。
