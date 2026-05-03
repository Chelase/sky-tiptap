<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="sky-dialog-backdrop"
      role="presentation"
      @mousedown.self="handleCancel"
    >
      <section
        ref="dialogRef"
        class="sky-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown.esc.prevent="handleCancel"
      >
        <header class="sky-dialog__header">
          <div>
            <h2 :id="titleId" class="sky-dialog__title">{{ title }}</h2>
            <p v-if="description" class="sky-dialog__description">{{ description }}</p>
          </div>
          <button
            type="button"
            class="sky-dialog__close"
            aria-label="关闭"
            @click="handleCancel"
          >
            <svg viewBox="0 0 24 24" class="sky-dialog__close-icon" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <form class="sky-dialog__body" @submit.prevent="handleConfirm">
          <label v-if="mode === 'input'" class="sky-dialog__field">
            <span class="sky-dialog__label">{{ inputLabel }}</span>
            <input
              ref="inputRef"
              v-model="inputValue"
              class="sky-dialog__input"
              :type="inputType"
              :placeholder="placeholder"
              autocomplete="off"
            >
          </label>

          <p v-else class="sky-dialog__message">{{ message }}</p>

          <p v-if="errorMessage" class="sky-dialog__error">{{ errorMessage }}</p>

          <footer class="sky-dialog__actions">
            <button
              type="button"
              class="sky-dialog__button sky-dialog__button--ghost"
              :disabled="submitting"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="submit"
              class="sky-dialog__button sky-dialog__button--primary"
              :disabled="submitting"
            >
              {{ submitting ? loadingText : confirmText }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { emitter } from '../../utils/emitter'

const visible = ref(false)
const mode = ref('input')
const title = ref('')
const description = ref('')
const message = ref('')
const inputLabel = ref('')
const inputType = ref('text')
const placeholder = ref('')
const inputValue = ref('')
const confirmText = ref('确认')
const cancelText = ref('取消')
const loadingText = ref('处理中...')
const errorMessage = ref('')
const submitting = ref(false)
const inputRef = ref(null)
const dialogRef = ref(null)
const titleId = `sky-dialog-title-${Math.random().toString(36).slice(2)}`
let onConfirm = null
let onCancel = null
let validate = null

const resetDialog = () => {
  mode.value = 'input'
  title.value = ''
  description.value = ''
  message.value = ''
  inputLabel.value = ''
  inputType.value = 'text'
  placeholder.value = ''
  inputValue.value = ''
  confirmText.value = '确认'
  cancelText.value = '取消'
  loadingText.value = '处理中...'
  errorMessage.value = ''
  submitting.value = false
  onConfirm = null
  onCancel = null
  validate = null
}

const openDialog = async (options = {}) => {
  mode.value = options.mode || 'input'
  title.value = options.title || ''
  description.value = options.description || ''
  message.value = options.message || ''
  inputLabel.value = options.inputLabel || '内容'
  inputType.value = options.inputType || 'text'
  placeholder.value = options.placeholder || ''
  inputValue.value = options.defaultValue || ''
  confirmText.value = options.confirmText || '确认'
  cancelText.value = options.cancelText || '取消'
  loadingText.value = options.loadingText || '处理中...'
  onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null
  onCancel = typeof options.onCancel === 'function' ? options.onCancel : null
  validate = typeof options.validate === 'function' ? options.validate : null
  errorMessage.value = ''
  visible.value = true

  await nextTick()
  if (mode.value === 'input') {
    inputRef.value?.focus()
    inputRef.value?.select()
  } else {
    dialogRef.value?.focus()
  }
}

const closeDialog = () => {
  visible.value = false
  resetDialog()
}

const handleCancel = () => {
  if (submitting.value) {
    return
  }
  onCancel?.()
  closeDialog()
}

const handleConfirm = async () => {
  if (submitting.value) {
    return
  }

  const value = inputValue.value.trim()

  if (mode.value === 'input') {
    const validationResult = validate?.(value)
    if (validationResult) {
      errorMessage.value = validationResult
      return
    }
  }

  try {
    submitting.value = true
    await onConfirm?.(mode.value === 'input' ? value : true)
    closeDialog()
  } catch (error) {
    errorMessage.value = error?.message || '操作失败，请稍后重试'
    submitting.value = false
  }
}

onMounted(() => {
  emitter.on('open-dialog', openDialog)
})

onBeforeUnmount(() => {
  emitter.off('open-dialog', openDialog)
})
</script>

<style scoped>
.sky-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--sky-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sky-spacing-xl);
  background: color-mix(in srgb, var(--sky-color-text) 34%, transparent);
  backdrop-filter: blur(8px);
  animation: sky-dialog-fade-in 160ms ease-out;
}

.sky-dialog {
  width: min(440px, 100%);
  padding: var(--sky-spacing-xl);
  border: 1px solid var(--sky-color-border);
  border-radius: var(--sky-radius-lg);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--sky-color-bg) 98%, var(--sky-color-bg-secondary)),
      color-mix(in srgb, var(--sky-color-bg) 94%, var(--sky-color-bg-secondary))
    ),
    var(--sky-color-bg);
  box-shadow: var(--sky-shadow-xl);
  color: var(--sky-color-text);
  overflow: hidden;
  animation: sky-dialog-pop-in 180ms ease-out;
}

.sky-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sky-spacing-md);
  margin-bottom: var(--sky-spacing-md);
}

.sky-dialog__title {
  margin: 0;
  font-size: var(--sky-font-size-lg);
  font-weight: 650;
  line-height: var(--sky-line-height-tight);
  color: var(--sky-color-text);
}

.sky-dialog__description {
  margin: var(--sky-spacing-xs) 0 0;
  font-size: var(--sky-font-size-sm);
  line-height: var(--sky-line-height-normal);
  color: var(--sky-color-text-secondary);
}

.sky-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--sky-color-text-secondary);
  cursor: pointer;
}

.sky-dialog__close-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.sky-dialog__body {

}

.sky-dialog__field {
  display: grid;
  gap: var(--sky-spacing-xs);
}

.sky-dialog__label {
  font-size: var(--sky-font-size-sm);
  font-weight: 600;
  color: var(--sky-color-text);
}

.sky-dialog__input {
  min-height: 42px;
  padding: 0 var(--sky-spacing-md);
  border: 1px solid var(--sky-color-border);
  border-radius: var(--sky-radius-md);
  background: var(--sky-color-bg);
  color: var(--sky-color-text);
  font: inherit;
  transition: border-color var(--sky-transition-fast), box-shadow var(--sky-transition-fast);
}

.sky-dialog__input:focus {
  border-color: var(--sky-color-primary);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sky-color-primary) 16%, transparent);
}

.sky-dialog__message {
  margin: 0;
  color: var(--sky-color-text-secondary);
  line-height: var(--sky-line-height-relaxed);
}

.sky-dialog__error {
  margin: var(--sky-spacing-sm) 0 0;
  font-size: var(--sky-font-size-sm);
  color: var(--sky-color-error);
}

.sky-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sky-spacing-sm);
  margin-top: var(--sky-spacing-lg);
}

.sky-dialog__button {
  min-width: 76px;
  height: 36px;
  padding: 0 var(--sky-spacing-md);
  font-weight: 600;
  cursor: pointer;
}

.sky-dialog__button--ghost {
  color: var(--sky-color-text-secondary);
  background: var(--sky-color-bg-secondary);
  border-color: var(--sky-color-border);
}

.sky-dialog__button--primary {
  color: var(--sky-color-bg);
  background: var(--sky-color-primary);
  border-color: var(--sky-color-primary);
}

.sky-dialog__button--primary:hover {
  background: var(--sky-color-primary-hover);
}

.sky-dialog__button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@keyframes sky-dialog-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes sky-dialog-pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sky-dialog-backdrop,
  .sky-dialog {
    animation: none;
  }
}
</style>
