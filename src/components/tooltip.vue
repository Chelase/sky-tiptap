<script setup>

const props = defineProps({
  text: {
    type: String,
    default: () => ''
  }
})

</script>

<template>
  <div class="tooltip">
    <span class="tooltip-text">{{ text }}</span>
  </div>
</template>

<style scoped>
/* Tooltip 容器 */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black; /* 悬停元素上显示点线 */
}

/* Tooltip 文本 */
.tooltip .tooltip-text {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  /* 定位 */
  position: absolute;
  z-index: 1;
}

/* 鼠标移动上去后显示提示框 */
.tooltip:hover .tooltip-text {
  visibility: visible;
}
</style>
