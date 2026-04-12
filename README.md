# sky-tiptap

**这是一款适用于 Vue3 的 Tiptap 富文本编辑器组件，开箱即用、功能丰富。**

---

### 安装

```bash
npm install @Chelase/sky-tiptap
```

---

### 基础使用

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

---

### 上传图片

sky-tiptap 会返回文件，只需调用 **insertImage** 方法插入即可：

```vue
<template>
  <div>
    <sky-tiptap
      ref="editor"
      v-model="content"
      @uploadPhoto="handleUploadPhoto"
    />
  </div>
</template>

<script setup>
import { SkyTiptap, insertImage } from '@Chelase/sky-tiptap'

const handleUploadPhoto = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await uploadPhoto(formData)
  insertImage(data[0])
}
</script>
```

---

### 手动获取富文本内容

```vue
<script setup>
import { SkyTiptap, getContent } from '@Chelase/sky-tiptap'

const getValue = () => {
  const value = getContent()
  console.log(value)
}
</script>
```

---

### 功能清单

#### 基础编辑
- ✅ 粗体、斜体、下划线、删除线
- ✅ 标题（H1、H2、H3）
- ✅ 无序列表、有序列表
- ✅ 撤销/重做
- ✅ 代码块（支持语法高亮）

#### 格式转换（Markdown 输入）
- `## ` + 空格 → 标题
- `**文字**` → 加粗
- `` `代码` `` → 行内代码
- `- ` 或 `* ` → 无序列表
- `1. ` → 有序列表
- `> ` → 引用块
- `---` → 分割线

#### 插入功能
- ✅ 图片上传
- ✅ Bilibili 视频嵌入
- ✅ YouTube 视频嵌入
- ✅ 抖音/TikTok 视频嵌入
- ✅ 网页 iframe 嵌入
- ✅ 表格插入
- ✅ 链接添加（Ctrl+点击在新标签页打开）

#### 其他
- ✅ AI 内容生成（集成 Sky-AI 流式响应）
- ✅ 悬浮菜单（Bubble Menu）
- ✅ 插入菜单（Insert Menu）
- ✅ 工具栏（Toolbar）

---

### API 参考

#### 组件 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | String | `''` | 双向绑定的内容 |
| `theme` | String | `'default'` | 主题（default/dark） |
| `showToolbar` | Boolean | `true` | 是否显示工具栏 |
| `placeholder` | String | `'输入内容...'` | 占位符 |

#### 组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | String | 内容变化时触发 |
| `uploadPhoto` | File | 图片上传时触发 |

#### 导出工具函数

```javascript
import { insertImage, getContent } from '@Chelase/sky-tiptap'

// 插入图片
insertImage('https://example.com/image.png')

// 获取编辑器内容
const html = getContent()
```

---

### 技术栈

- **Vue 3** - 前端框架
- **Tiptap 2.x** - 富文本编辑器核心
- **Vite 6.x** - 构建工具
- **lowlight** - 代码语法高亮
- **highlight.js** - 高亮主题

---

### 版本

当前版本：**1.2.0**

详细更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)
