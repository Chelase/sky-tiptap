<!-- ToolbarButton.vue - 可复用的工具栏按钮组件 -->
<template>
  <button
    :class="['sky-toolbar-button', { 'is-active': isActive }]"
    :title="tooltip"
    :disabled="disabled"
    @click="handleClick"
    type="button"
  >
    <!-- 支持 SVG 字符串或插槽 -->
    <svg v-if="iconSvg" v-html="iconSvg" class="sky-toolbar-button__icon"></svg>
    <slot v-else></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 点击回调
  onClick: {
    type: Function,
    required: true
  },
  // 是否激活状态
  isActive: {
    type: Boolean,
    default: false
  },
  // 工具提示
  tooltip: {
    type: String,
    default: ''
  },
  // SVG 图标字符串
  iconSvg: {
    type: String,
    default: ''
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

const handleClick = () => {
  if (!props.disabled) {
    props.onClick()
  }
}
</script>

<style scoped>
.sky-toolbar-button {
  padding: 6px 8px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sky-radius-md);
  transition: all var(--sky-transition-fast);
}

.sky-toolbar-button__icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.sky-toolbar-button:hover:not(:disabled) {
  background-color: var(--sky-color-bg-tertiary);
}

.sky-toolbar-button.is-active {
  background-color: var(--sky-color-primary);
  color: white;
}

.sky-toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
