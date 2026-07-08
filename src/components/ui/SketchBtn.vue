<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'ghost' | 'primary' | 'warn'
  disabled?: boolean
}>(), { variant: 'ghost' })
</script>

<template>
  <button
    class="sketch-btn"
    :class="`sketch-btn--${variant}`"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<style scoped>
.sketch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  border-radius: 10px 13px 11px 14px;
  border: 1.5px solid var(--line);
  cursor: pointer;
  transition: transform 0.1s;
}
.sketch-btn:hover:not(:disabled) { transform: translateY(-1px); }
.sketch-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.sketch-btn--ghost {
  background: var(--paper);
  color: var(--ink-2);
}
.sketch-btn--primary {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  color: #fff;
}
.sketch-btn--warn {
  background: var(--warn-soft);
  border-color: var(--warn);
  color: var(--warn);
}
</style>
