<script setup>
import {ref} from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true
  }
})

const show = ref(false)
</script>

<template>
  <div class="tooltip-container" @mouseenter="show = true" @mouseleave="show = false">
    <slot />
    <transition name="fade">
      <div v-if="show" class="tooltip-box">
        {{ text }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-box {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-bottom: 8px;
  pointer-events: none;
  z-index: 1000;
}

.tooltip-box::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
