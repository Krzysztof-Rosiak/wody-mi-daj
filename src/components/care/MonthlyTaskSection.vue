<script setup lang="ts">
import { computed } from 'vue'
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import type { Plant } from '@/types'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconCheckCircle from '@/components/icons/IconCheckCircle.vue'

const props = defineProps<{
  label: string
  color: string
  plants: Plant[]
  emptyText: string
  expanded: boolean
}>()

const emit = defineEmits<{
  'update:expanded': [boolean]
}>()

const roomGroups = computed(() => {
  const sorted = [...props.plants].sort((a, b) => a.room.localeCompare(b.room, 'pl'))
  const groups: { room: string; plants: Plant[] }[] = []
  for (const plant of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.room === plant.room) last.plants.push(plant)
    else groups.push({ room: plant.room, plants: [plant] })
  }
  return groups
})
</script>

<template>
  <div class="sketch-card">
    <button class="card-head" @click="emit('update:expanded', !expanded)">
      <slot name="icon" />
      <span class="card-head__label" :style="{ color }">{{ label }}</span>
      <span
        v-if="plants.length"
        class="card-head__pill"
        :style="{ borderColor: color, background: `color-mix(in oklab, ${color} 15%, transparent)`, color }"
      >{{ plants.length }}</span>
      <IconChevronDown
        class="card-head__chevron"
        :class="{ 'card-head__chevron--open': expanded }"
        :size="14"
      />
    </button>

    <div v-if="expanded" class="card-body" :class="{ 'pa-0': plants.length }">
      <template v-if="plants.length">
        <div
          v-for="group in roomGroups"
          :key="group.room"
          class="room-group"
        >
          <div v-if="roomGroups.length > 1" class="room-label">{{ group.room }}</div>
          <div
            v-for="(plant, i) in group.plants"
            :key="plant.id"
            class="plant-row"
            :class="{ 'plant-row--divider': i > 0 }"
          >
            <RouterLink :to="`/rosliny/${plant.id}`" class="plant-link">
              <PlantAvatar
                :name="plant.name"
                :image-base64="plant.imageBase64"
                :size="46"
              />
              <div class="plant-meta">
                <div class="plant-name">{{ plant.name }}</div>
              </div>
            </RouterLink>
            <slot name="actions" :plant="plant" />
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <IconCheckCircle :size="20" stroke="var(--accent-deep)" />
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.sketch-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: 28px;
}

.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  background: var(--paper);
  border: none;
  border-bottom: 1.5px dashed var(--ink-3);
  cursor: pointer;
  outline: none;
  transition: background 0.1s;
}
.card-head:hover {
  background: color-mix(in oklab, var(--paper) 80%, var(--line));
}

.card-head__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 500;
  flex: 1;
}

.card-head__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border: 1.3px solid;
  border-radius: 11px 13px 10px 14px;
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 15px;
}

.card-head__chevron {
  color: var(--ink-3);
  opacity: 0.5;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.card-head__chevron--open {
  transform: rotate(180deg);
}

.card-body {
  padding: 10px 14px;
  background: var(--paper-card);
}
.pa-0 { padding: 0; }

.room-group {
  border-bottom: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
}
.room-group:last-child {
  border-bottom: none;
}

.room-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-2);
  padding: 6px 14px 5px;
  background: color-mix(in oklab, var(--paper-2) 60%, transparent);
  border-bottom: 1px solid color-mix(in oklab, var(--line) 80%, transparent);
}

.plant-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
}
.plant-row--divider {
  border-top: 1px dashed color-mix(in oklab, var(--ink-3) 50%, transparent);
}

.plant-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.plant-meta { min-width: 0; }

.plant-name {
  font-family: 'Kalam', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: var(--ink-2);
  font-family: 'Lato', sans-serif;
  font-size: 15px;
}
</style>
