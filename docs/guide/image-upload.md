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