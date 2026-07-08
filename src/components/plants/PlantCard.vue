<script setup lang="ts">
import { computed } from 'vue'
import type { Plant } from '@/types'
import IconWater from '@/components/icons/IconWater.vue'
import IconChevronRight from '@/components/icons/IconChevronRight.vue'
import { getWateringInterval } from '@/composables/usePlantSchedule'

const props = defineProps<{
  plant: Plant
  lastWateringDate?: string
  hideRoom?: boolean
}>()

const MONTH_SHORT_PL = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
]

const nextWateringLabel = computed(() => {
  if (!props.lastWateringDate) return null
  const interval = getWateringInterval(props.plant)
  if (!interval) return null
  const last = new Date(props.lastWateringDate)
  last.setHours(0, 0, 0, 0)
  const next = new Date(last)
  next.setDate(next.getDate() + interval)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (next <= today) return 'Dziś'
  const sameYear = next.getFullYear() === today.getFullYear()
  const label = `${next.getDate()} ${MONTH_SHORT_PL[next.getMonth()]}`
  return sameYear ? label : `${label} ${next.getFullYear()}`
})

function plantInitial(name: string) {
  return name[0]?.toUpperCase() ?? '?'
}
</script>

<template>
  <RouterLink :to="`/rosliny/${plant.id}`" class="plant-row">
    <div class="plant-row__avatar">
      <img
        v-if="plant.imageBase64"
        :src="plant.imageBase64"
        :alt="plant.name"
        class="plant-row__img"
        loading="lazy"
      />
      <span v-else class="plant-row__initial">{{ plantInitial(plant.name) }}</span>
    </div>

    <div class="plant-row__info">
      <div class="plant-row__name">{{ plant.name }}</div>
      <div class="plant-row__sub">
        <span v-if="plant.species" class="plant-row__species">{{ plant.species }}</span>
        <span v-if="!hideRoom" class="plant-row__room">{{ plant.room }}</span>
      </div>
    </div>

    <div class="plant-row__end">
      <span v-if="nextWateringLabel" class="water-tag">
        <IconWater :size="10" />
        {{ nextWateringLabel }}
      </span>
      <IconChevronRight class="plant-row__chevron" :size="14" />
    </div>
  </RouterLink>
</template>

<style scoped>
.plant-row {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 35%, transparent);
  transition: background 0.1s;
  text-decoration: none;
  color: inherit;
}
.plant-row:last-child {
  border-bottom: 0;
}
.plant-row:hover {
  background: var(--paper);
}

.plant-row__avatar {
  width: 38px;
  height: 38px;
  border: 2px solid var(--line);
  background: var(--accent-soft);
  border-radius: var(--r-blob);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.plant-row__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.plant-row__initial {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: var(--accent-deep);
  opacity: 0.55;
  line-height: 1;
}

.plant-row__info {
  min-width: 0;
}
.plant-row__name {
  font-family: 'Kalam', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.plant-row__sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.plant-row__species {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.plant-row__room {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  border: 1.2px solid var(--line);
  border-radius: 5px 7px 6px 8px;
  padding: 1px 5px;
  white-space: nowrap;
  flex-shrink: 0;
}

.plant-row__end {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.water-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  white-space: nowrap;
}

.plant-row__chevron {
  color: var(--ink-3);
  opacity: 0.4;
}

@media (max-width: 400px) {
  .plant-row {
    padding: 7px 10px;
    gap: 8px;
  }
}
@media (max-width: 360px) {
  .plant-row {
    padding: 6px 8px;
    gap: 6px;
  }
  .plant-row__avatar {
    width: 34px;
    height: 34px;
  }
  .plant-row__sub {
    flex-wrap: wrap;
    gap: 4px;
  }
  .plant-row__name {
    font-size: 14px;
  }
}
</style>
