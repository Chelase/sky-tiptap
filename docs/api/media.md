# 媒体 API

## 插入图片

```javascript
import { insertImage, insertImages } from '@Chelase/sky-tiptap'

insertImage('https://example.com/image.png')

insertImages([
  'https://example.com/one.png',
  'https://example.com/two.png'
])
```

## 图片上传

Sky Tiptap 不内置 HTTP 上传接口。业务侧监听 `uploadPhoto`，完成上传后再调用 `insertImage` 或 `insertImages`。

```vue
<script setup>
import { SkyTiptap, insertImages } from '@Chelase/sky-tiptap'

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

<template>
  <sky-tiptap
    v-model="content"
    @uploadPhoto="handleUploadPhoto"
  />
</template>
```

## 插入视频

```javascript
import { insertVideo, insertVideos } from '@Chelase/sky-tiptap'

insertVideo('https://example.com/video.mp4')

insertVideos([
  'https://example.com/one.mp4',
  'https://example.com/two.mp4'
])
```

## 视频上传

```vue
<script setup>
import { SkyTiptap, insertVideos } from '@Chelase/sky-tiptap'

const handleUploadVideo = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadVideo(formData)
      return data.url
    })
  )

  insertVideos(urls)
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    @uploadVideo="handleUploadVideo"
  />
</template>
```

## 粘贴图片处理

粘贴图片处理详见：[事件 - paste 事件](./events.md#paste-事件)。
