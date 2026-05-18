# 图片上传

Sky Tiptap 不内置 HTTP 上传接口。点击插入图片后，组件会把选择的图片文件交给外部业务代码；业务侧完成上传并拿到图片 URL 后，再调用 `insertImage` 或 `insertImages` 插入编辑器。

## 基本用法

图片选择支持单图和多图，统一使用 `uploadPhoto` 事件。事件参数始终是 `File[]`，单图时数组长度为 1。

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
import { ref } from 'vue'
import { SkyTiptap, insertImages } from '@Chelase/sky-tiptap'

const content = ref('')

const handleUploadPhoto = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadPhoto(formData)
      return data[0]
    })
  )

  insertImages(urls)
}
</script>
```

## 手动插入图片

如果需要在代码中手动插入图片：

```javascript
import { insertImage, insertImages } from '@Chelase/sky-tiptap'

// 插入单张图片
insertImage('https://example.com/image.png')

// 批量插入图片
insertImages([
  'https://example.com/one.png',
  'https://example.com/two.png'
])
```

## 处理粘贴图片

如果用户从网页、截图工具或聊天软件复制图片后直接粘贴到编辑器，默认粘贴逻辑可能会把图片以 base64 写入内容。图片一大，HTML 会迅速变得很长，后续存入数据库后可能影响查询和渲染性能。

Sky Tiptap 提供 `paste` 事件。业务侧可以在这个事件中拦截剪贴板文件，上传到自己的服务器，再用图片 URL 插入编辑器。

需要注意：如果没有监听 `paste`，或者监听后没有调用 `pasteEvent.preventDefault()`，编辑器会继续执行默认粘贴行为，base64 图片仍可能被插入。

```vue
<template>
  <sky-tiptap
    ref="editor"
    v-model="content"
    @paste="handlePaste"
  />
</template>

<script setup>
import { ref } from 'vue'
import { SkyTiptap } from '@Chelase/sky-tiptap'

const editor = ref()
const content = ref('')

const handlePaste = async (pasteEvent) => {
  if (!pasteEvent.files.length) return

  pasteEvent.preventDefault()

  const urls = await Promise.all(
    pasteEvent.files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadPhoto(formData)
      return data.url
    })
  )

  editor.value?.insertImages(urls)
}
</script>
```

## 配合 axios 使用

```javascript
import axios from 'axios'
import { insertImages } from '@Chelase/sky-tiptap'

const handleUploadPhoto = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post('/api/upload', formData)
      return data.url
    })
  )

  insertImages(urls)
}
```

## 配合 uni-app 使用

```javascript
import { insertImages } from '@Chelase/sky-tiptap'

const handleUploadPhoto = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'https://your-api.com/upload',
          filePath: URL.createObjectURL(file),
          name: 'file',
          success: (res) => {
            const data = JSON.parse(res.data)
            resolve(data.url)
          },
          fail: reject
        })
      })
    })
  )

  insertImages(urls)
}
```
