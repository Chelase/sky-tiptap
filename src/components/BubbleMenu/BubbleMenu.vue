<!-- BubbleMenu.vue - 悬浮菜单组件（选中文字时显示，由 defaultBubbleMenuConfig 驱动） -->
<template>
  <bubble-menu
    v-if="editor"
    class="sky-bubble-menu"
    :editor="editor"
    :tippy-options="tippyOptions"
  >
    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
      <div v-if="groupIndex > 0" class="sky-bubble-menu__divider"></div>
      <ToolbarButton
        v-for="item in group.items"
        :key="item.key"
        :onClick="item.run"
        :isActive="item.isActive"
        :disabled="item.disabled"
        :tooltip="item.tooltip"
        :iconSvg="item.iconSvg"
      >
        {{ item.label }}
      </ToolbarButton>
    </template>
  </bubble-menu>
</template>

<script setup>
import { computed } from 'vue'
import { BubbleMenu } from '@tiptap/vue-3'
import ToolbarButton from '../Toolbar/ToolbarButton.vue'
import { defaultBubbleMenuConfig } from '../../config/menu-config'
import { resolveMenuGroups } from '../../utils/menu-items'

const props = defineProps({
  editor: {
    type: Object,
    required: true
  },
  /** 悬浮菜单配置，默认使用 defaultBubbleMenuConfig */
  config: {
    type: Object,
    default: () => defaultBubbleMenuConfig
  }
})

// Tippy.js 配置
const tippyOptions = {
  duration: 150,
  maxWidth: 400,
  appendTo: 'parent',
  zIndex: 100,
}

const groups = computed(() => resolveMenuGroups(props.config, props.editor))
</script>

<style scoped>
@import '../../styles/variables.css';

.sky-bubble-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background-color: var(--sky-color-bg);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.sky-bubble-menu__divider {
  width: 1px;
  height: 20px;
  background-color: var(--sky-color-border);
  margin: 0 4px;
}
</style>
