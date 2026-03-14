<!-- CodeBlock.vue - 代码块节点视图组件 -->
<template>
  <node-view-wrapper class="sky-code-block">
    <div class="sky-code-block__header">
      <span class="sky-code-block__language">{{ language }}</span>
      <button @click="copyCode" class="sky-code-block__copy" title="复制代码">
        <svg v-html="icons.check" class="sky-code-block__icon" v-if="copied"></svg>
        <svg v-html="icons.code" class="sky-code-block__icon" v-else></svg>
        <span>{{ copied ? '已复制' : '复制' }}</span>
      </button>
    </div>
    <pre><code :ref="codeRef"></code></pre>
  </node-view-wrapper>
</template>

<script setup>
import { ref } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { icons } from '../../icons'

const props = defineProps(nodeViewProps)
const codeRef = ref(null)
const copied = ref(false)

const language = props.node.attrs.language || 'text'

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.node.textContent)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<style scoped>
@import '../../styles/variables.css';

.sky-code-block {
  margin: var(--sky-spacing-lg) 0;
  border-radius: var(--sky-radius-lg);
  overflow: hidden;
  border: 1px solid var(--sky-color-border);
}

.sky-code-block__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sky-spacing-sm) var(--sky-spacing-md);
  background-color: var(--sky-color-bg-secondary);
  border-bottom: 1px solid var(--sky-color-border);
}

.sky-code-block__language {
  font-size: var(--sky-font-size-xs);
  font-weight: 600;
  color: var(--sky-color-text-muted);
  text-transform: uppercase;
}

.sky-code-block__copy {
  display: flex;
  align-items: center;
  gap: var(--sky-spacing-xs);
  padding: var(--sky-spacing-xs) var(--sky-spacing-sm);
  font-size: var(--sky-font-size-xs);
  background: transparent;
  border: 1px solid var(--sky-color-border);
  border-radius: var(--sky-radius-md);
  cursor: pointer;
  transition: all var(--sky-transition-fast);
  color: var(--sky-color-text-secondary);
}

.sky-code-block__copy:hover {
  background-color: var(--sky-color-bg-tertiary);
  border-color: var(--sky-color-border-hover);
}

.sky-code-block__icon {
  width: 14px;
  height: 14px;
}

.sky-code-block pre {
  margin: 0;
  padding: var(--sky-spacing-lg);
  background-color: var(--sky-color-bg-secondary);
  overflow-x: auto;
}

.sky-code-block code {
  font-family: var(--sky-font-mono);
  font-size: var(--sky-font-size-sm);
  line-height: var(--sky-line-height-relaxed);
  color: var(--sky-color-text);
}
</style>
