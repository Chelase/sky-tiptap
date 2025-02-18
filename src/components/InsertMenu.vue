<template>
  <div
      v-if="visible"
      class="insert-menu"
      :style="{
      top: `${position.top}px`,
      left: `${position.left}px`
    }"
      @click.stop="onMenuClick"
  >
    <button @click="insert('image')">插入图片</button>
    <button @click="insert('video')">插入视频</button>
    <button @click="insert('codeBlock')">插入代码块</button>
  </div>
  <div class="video-menu insert-menu" v-if="showVideoMenu">
    <button @click="insertVideo('bilibili')">bilibili视频</button>
    <button @click="insertVideo('youtube')">youtube视频</button>
    <button @click="insertVideo('tiktok')">抖音视频</button>
    <button @click="showVideoMenu = false">取消</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted } from 'vue'

import {emitter} from "../utils/emitter";


const visible = ref(false)
const position = ref({ top: 0, left: 0 })
let insertCallback = null

const showVideoMenu = ref(false)

const insertVideo = (platform) => {
  emitter.emit(`trigger-add-${platform}`)
  showVideoMenu.value = false
  visible.value = false
}

const show = (options) => {
  position.value = options.position
  insertCallback = options.insert
  visible.value = true
}

const hide = () => {
  visible.value = false
  showVideoMenu.value = false
}

// 添加点击菜单内部的事件阻止
const onMenuClick = (e) => {
  e.stopPropagation()
}

const insert = (type) => {
  if (type === 'video') {
    // 视频类型交给子菜单处理
    showVideoMenu.value = true
    visible.value = false
    return
  }
  insertCallback?.(type)
  hide()
}

// 在 InsertMenu.vue 中
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    hide()
  }
}

// 全局事件监听
onMounted(() => {
  emitter.on('show-insert-menu', show)
  document.addEventListener('click', hide)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  emitter.off('show-insert-menu', show)
  document.removeEventListener('click', hide)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
.insert-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1000;
}

.video-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>