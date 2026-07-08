<script setup lang="ts">
defineProps<{
  title: string
  sub?: string
}>()
</script>

<template>
  <div class="empty-state">
    <slot />
    <div class="empty-title">{{ title }}</div>
    <div v-if="sub" class="empty-sub">{{ sub }}</div>
    <slot name="action" />
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-title {
  font-family: 'Lato', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--ink-2);
}

.empty-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-3);
}
</style>
