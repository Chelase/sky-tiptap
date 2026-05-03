# 视频嵌入与上传

Sky Tiptap 支持多种视频平台的嵌入和本地视频上传。

## 支持的平台

- Bilibili
- YouTube
- 抖音/TikTok
- 本地视频上传
- 通用 iframe 嵌入

## 嵌入在线视频

通过插入菜单（Insert Menu）选择对应的视频类型，输入视频链接即可嵌入。

### Bilibili

支持的链接格式：
- `https://www.bilibili.com/video/BV1xx411c7XW`
- 直接输入 BV 号：`BV1xx411c7XW`

### YouTube

支持的链接格式：
- `https://www.youtube.com/watch?v=xxxxx`
- `https://youtu.be/xxxxx`
- 直接输入视频 ID：`xxxxx`（11 位字符）

### 抖音/TikTok

支持的链接格式：
- `https://www.douyin.com/video/7635170198135278902`
- `https://www.douyin.com/note/7635170198135278902`
- `https://open.douyin.com/player/video?vid=7635170198135278902`
- `https://www.iesdouyin.com/share/video/7635170198135278902/`
- 直接输入视频 ID：`7635170198135278902`

抖音视频使用官方播放器嵌入，默认尺寸 720×1280（竖屏）。

### 通用 iframe

对于其他视频平台或网页，可以使用通用 iframe 嵌入。输入完整的 URL 即可。

## 本地视频上传

从 v1.3.0 开始，支持上传本地视频文件。

### 使用方式

1. 点击插入菜单中的「上传视频」按钮
2. 选择本地视频文件（支持多选）
3. 通过 `uploadVideo` 事件上传到服务器
4. 使用 `insertVideo` 或 `insertVideos` 插入视频

```vue
<script setup>
import { ref } from 'vue'
import { SkyTiptap, insertVideos } from '@Chelase/sky-tiptap'

const content = ref('')

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

### 上传后插入

如果视频已经上传到服务器，可以直接使用工具函数插入：

```javascript
import { insertVideo, insertVideos } from '@Chelase/sky-tiptap'

// 插入单个视频
insertVideo('https://example.com/video.mp4')

// 批量插入视频
insertVideos([
  'https://example.com/one.mp4',
  'https://example.com/two.mp4'
])
```

## 视频样式

嵌入的视频（iframe 和本地视频）都支持响应式布局，默认尺寸：

| 类型 | 宽度 | 高度 |
|------|------|------|
| Bilibili | 640 | 360 |
| YouTube | 640 | 360 |
| 抖音 | 720 | 1280 |
| 本地视频 | 640 | 360 |
| 通用 iframe | 640 | 360 |
