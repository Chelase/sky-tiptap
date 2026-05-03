# 快速开始

## 安装

```bash
npm install @Chelase/sky-tiptap
```

## 基础使用

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

## 组件 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | String | `''` | 双向绑定的内容 |
| `theme` | String | `'default'` | 主题（default/dark） |
| `showToolbar` | Boolean | `false` | 是否显示工具栏 |
| `placeholder` | String | `'输入内容...'` | 占位符 |

## 组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | String | 内容变化时触发 |
| `uploadPhoto` | File[] | 选择图片时触发，支持单图和多图 |

## 获取编辑器实例

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()

onMounted(() => {
  // 访问 Tiptap 编辑器实例
  console.log(editor.value.editor)
})
</script>
```

## 获取内容

```vue
<script setup>
import { SkyTiptap, getContent } from '@Chelase/sky-tiptap'

const getValue = () => {
  const value = getContent()
  console.log(value)
}
</script>
```