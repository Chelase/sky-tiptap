<!-- Toolbar.vue - 工具栏组件（由 defaultToolbarConfig 驱动） -->
<template>
  <div class="sky-toolbar">
    <div v-for="(group, groupIndex) in groups" :key="group.name || groupIndex" class="sky-toolbar-group">
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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ToolbarButton from './ToolbarButton.vue'
import { defaultToolbarConfig } from '../../config/menu-config'
import { resolveMenuGroups } from '../../utils/menu-items'

const props = defineProps({
  editor: {
    type: Object,
    required: true
  },
  /** 工具栏配置，默认使用 defaultToolbarConfig */
  config: {
    type: Object,
    default: () => defaultToolbarConfig
  }
})

const groups = computed(() => resolveMenuGroups(props.config, props.editor))
</script>

<style scoped>
</style>
