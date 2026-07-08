<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <button class="icon-btn" :style="size ? `width:${size}px;height:${size}px` : undefined">
    <slot />
  </button>
</template>

<style scoped>
.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid var(--line);
  border-radius: 8px 10px 9px 11px;
  cursor: pointer;
  color: var(--ink-3);
  flex-shrink: 0;
}
.icon-btn:hover { background: var(--paper-2); }
</style>
