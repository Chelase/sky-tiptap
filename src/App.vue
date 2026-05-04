<template>
  <div class="app-container">
    <h1>Sky Tiptap - 开发测试</h1>

    <div class="test-controls">
      <label>
        <input type="checkbox" v-model="showToolbar"> 显示工具栏
      </label>
      <label>
        主题：
        <select v-model="theme">
          <option value="default">默认</option>
          <option value="dark">暗色</option>
        </select>
      </label>
    </div>

    <SkyTiptap
        v-model="content"
        :showToolbar="showToolbar"
        :theme="theme"
        @uploadPhoto="handleUploadPhoto"
        @uploadVideo="handleUploadVideo"
        :ai-config="aiConfig"
    />

    <div class="content-preview">
      <h3>HTML 输出：</h3>
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {SkyTiptap, insertImages, insertVideos} from './main.js'

const content = ref('<p>开始编辑内容...</p>')
const showToolbar = ref(false)
const theme = ref('default')
const aiConfig = {
  mode: 'actions',
  baseUrl: 'https://www.right.codes/codex/v1/responses',
  apiKey: 'sk-4476b366cf854e07bc6e5cf1cb285057',
  buildBody: (prompt) => ({
    model: 'gpt-5.2',
    input: [
      {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt,
          },
        ],
      },
    ],
    stream: true,
  }),
}

const handleUploadPhoto = async (files) => {
  console.log('上传文件:', files)
  // 模拟上传
  const urls = files.map((file) => URL.createObjectURL(file))
  insertImages(urls)
}

const handleUploadVideo = async (files) => {
  console.log('上传视频:', files)
  // 模拟上传
  const urls = files.map((file) => URL.createObjectURL(file))
  insertVideos(urls)
}
</script>

<style>
body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.app-container {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #1f2937;
}

.test-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.content-preview {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.content-preview h3 {
  margin-top: 0;
  color: #1f2937;
}

.content-preview pre {
  background: #f3f4f6;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
</style>
