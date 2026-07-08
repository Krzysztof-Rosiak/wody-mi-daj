<script setup lang="ts" generic="T extends { plant: Plant }">
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import type { Plant } from '@/types'

defineProps<{
  groups: { room: string; items: T[] }[]
  itemKey: (item: T) => string | number | undefined
}>()
</script>

<template>
  <div v-for="group in groups" :key="group.room" class="upcoming-room-group">
    <div class="upcoming-room-label">{{ group.room }}</div>
    <RouterLink
      v-for="item in group.items"
      :key="itemKey(item)"
      :to="`/rosliny/${item.plant.id}`"
      class="day-row"
    >
      <PlantAvatar :name="item.plant.name" :image-base64="item.plant.imageBase64" :size="46" />
      <div class="day-row__info">
        <div class="day-row__name">{{ item.plant.name }}</div>
      </div>
      <slot name="tag" :item="item" />
    </RouterLink>
  </div>
</template>

<style scoped>
.upcoming-room-group {
  border-bottom: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
}
.upcoming-room-group:last-child {
  border-bottom: none;
}
.upcoming-room-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-2);
  padding: 6px 14px 5px;
  background: color-mix(in oklab, var(--paper-2) 60%, transparent);
  border-bottom: 1px solid color-mix(in oklab, var(--line) 80%, transparent);
}

.day-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 35%, transparent);
  cursor: pointer;
  transition: background 0.1s;
  text-decoration: none;
  color: inherit;
}
.day-row:last-child {
  border-bottom: 0;
}
.day-row:hover {
  background: var(--paper);
}

.day-row__info {
  min-width: 0;
}
.day-row__name {
  font-family: 'Kalam', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 400px) {
  .day-row {
    padding: 9px 12px;
    gap: 8px;
  }
}
</style>
