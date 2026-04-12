<!-- CodeBlock.vue - 代码块节点视图组件 -->
<template>
  <node-view-wrapper class="sky-code-block">
    <div class="sky-code-block__header">
      <select v-model="selectedLanguage" class="sky-code-block__language-select">
        <option value="text">纯文本</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
        <option value="c">C</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="sql">SQL</option>
        <option value="json">JSON</option>
        <option value="markdown">Markdown</option>
        <option value="shell">Shell</option>
        <option value="yaml">YAML</option>
      </select>
      <button @click="copyCode" class="sky-code-block__copy" title="复制代码">
        <svg v-html="icons.check" class="sky-code-block__icon" v-if="copied"></svg>
        <svg v-html="icons.code" class="sky-code-block__icon" v-else></svg>
        <span>{{ copied ? '已复制' : '复制' }}</span>
      </button>
    </div>
    <pre><code><node-view-content></node-view-content></code></pre>
  </node-view-wrapper>
</template>

<script setup>
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { icons } from '../../icons'

const props = defineProps(nodeViewProps)
const updateAttributes = props.updateAttributes
const copied = ref(false)

const selectedLanguage = computed({
  get: () => props.node.attrs.language || 'text',
  set: (language) => {
    updateAttributes({ language })
  }
})

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

.sky-code-block__language-select {
  font-size: var(--sky-font-size-xs);
  font-weight: 600;
  color: var(--sky-color-text-muted);
  text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--sky-color-border);
  border-radius: var(--sky-radius-sm);
  padding: var(--sky-spacing-xs) var(--sky-spacing-sm);
  cursor: pointer;
  outline: none;
  transition: all var(--sky-transition-fast);
}

.sky-code-block__language-select:hover {
  border-color: var(--sky-color-border-hover);
  background-color: var(--sky-color-bg-tertiary);
}

.sky-code-block__language-select:focus {
  border-color: var(--sky-color-primary);
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
