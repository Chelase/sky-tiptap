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
import { icons } from '../../icons'
import ToolbarButton from './ToolbarButton.vue'
import { defaultToolbarConfig } from '../../config/menu-config'
import { getToolbarItemSpec } from '../../config/toolbar-items'

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

const groups = computed(() => {
  const source = props.config?.groups || []

  return source
    .map((group) => ({
      name: group.name,
      items: (group.items || [])
        .map((key) => {
          const spec = getToolbarItemSpec(key)
          if (!spec) {
            return null
          }

          return {
            key,
            iconSvg: spec.icon ? icons[spec.icon] : '',
            label: spec.label || '',
            tooltip: spec.tooltip || '',
            isActive: spec.isActive ? spec.isActive(props.editor) : false,
            disabled: spec.disabled ? spec.disabled(props.editor) : false,
            run: () => spec.run?.(props.editor),
          }
        })
        .filter(Boolean),
    }))
    .filter((group) => group.items.length > 0)
})
</script>

<style scoped>
</style>
