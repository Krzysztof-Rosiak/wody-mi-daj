<script setup lang="ts">
import { computed } from 'vue'
import type { Plant, CareEvent, Snooze, SnoozedCareType } from '@/types'
import {
  getWateringInterval,
  getFertilizingInterval,
  getMistingInterval,
  getCleaningInterval,
} from '@/composables/usePlantSchedule'
import PlantCareChart from '@/components/plants/PlantCareChart.vue'
import IconLineChart from '@/components/icons/IconLineChart.vue'
import IconWater from '@/components/icons/IconWater.vue'
import IconMisting from '@/components/icons/IconMisting.vue'
import IconFertilizing from '@/components/icons/IconFertilizing.vue'
import IconCleaning from '@/components/icons/IconCleaning.vue'
import IconSnooze from '@/components/icons/IconSnooze.vue'
import IconProgressRing from '@/components/icons/IconProgressRing.vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  plant: Plant
  events: CareEvent[]
  snoozes?: Snooze[]
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

interface CareItem {
  type: string
  label: string
  iconSlot: 'water' | 'fertilize' | 'mist' | 'clean'
  interval: number
  daysSince: number | null
  daysUntil: number
  progress: number
  snoozeUntil: Date | null
}

function activeSnooze(careType: SnoozedCareType): Date | null {
  if (!props.snoozes) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const s = props.snoozes.find((s) => s.careType === careType)
  if (!s) return null
  const until = new Date(s.until)
  until.setHours(0, 0, 0, 0)
  return until >= today ? until : null
}

function lastDaysSince(type: string): number | null {
  let best: Date | null = null
  for (const e of props.events) {
    if (e.type !== type) continue
    const d = new Date(e.date)
    if (!best || d > best) best = d
  }
  if (!best) return null
  return Math.floor((Date.now() - best.getTime()) / 86_400_000)
}

function makeItem(
  type: string,
  label: string,
  iconSlot: CareItem['iconSlot'],
  interval: number | null,
  careType: SnoozedCareType,
): CareItem | null {
  if (!interval) return null
  const daysSince = lastDaysSince(type)
  const snoozeDate = activeSnooze(careType)

  let daysUntil: number
  let progress: number

  if (snoozeDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    daysUntil = Math.round((snoozeDate.getTime() - today.getTime()) / 86_400_000)
    const totalSpan = daysSince !== null
      ? Math.round((snoozeDate.getTime() - (today.getTime() - daysSince * 86_400_000)) / 86_400_000)
      : null
    progress = totalSpan ? Math.min(daysSince! / totalSpan, 1) : 0
  } else {
    const elapsed = daysSince ?? interval
    daysUntil = interval - elapsed
    progress = Math.min(elapsed / interval, 1)
  }

  return {
    type,
    label,
    iconSlot,
    interval,
    daysSince,
    daysUntil,
    progress,
    snoozeUntil: snoozeDate,
  }
}

const settingsStore = useSettingsStore()

const careItems = computed((): CareItem[] => {
  const month = new Date().getMonth()
  const wateringItem = makeItem('watering', 'Podlewanie', 'water', getWateringInterval(props.plant, month), 'watering')
  let fertilizingItem = makeItem('fertilizing', 'Nawożenie', 'fertilize', getFertilizingInterval(props.plant, month), 'fertilizing')

  // In combined mode: if fertilizing is overdue but watering is upcoming, move fertilizing to the watering date
  if (
    settingsStore.combineWateringFertilizing &&
    fertilizingItem &&
    wateringItem &&
    fertilizingItem.daysUntil <= 0 &&
    wateringItem.daysUntil > 0
  ) {
    const wDays = wateringItem.daysUntil
    const totalSpan = fertilizingItem.daysSince !== null ? fertilizingItem.daysSince + wDays : null
    fertilizingItem = {
      ...fertilizingItem,
      daysUntil: wDays,
      progress: totalSpan ? Math.min(fertilizingItem.daysSince! / totalSpan, 1) : 0,
    }
  }

  return [
    wateringItem,
    fertilizingItem,
    makeItem('misting', 'Zraszanie', 'mist', getMistingInterval(props.plant, month), 'misting'),
    makeItem('cleaning', 'Czyszczenie', 'clean', getCleaningInterval(props.plant), 'cleaning'),
  ].filter((x): x is CareItem => x !== null)
})

function nextDateLabel(daysUntil: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysUntil)
  return `${d.getDate()} ${MONTH_SHORT_PL[d.getMonth()]}`
}

function nextLabel(item: CareItem): string {
  if (item.snoozeUntil) {
    const d = item.snoozeUntil
    return `${d.getDate()} ${MONTH_SHORT_PL[d.getMonth()]}`
  }
  if (item.daysSince === null) return 'Nie wykonano'
  if (item.daysUntil < 0) return 'Dzisiaj'
  if (item.daysUntil === 0) return 'Dziś'
  if (item.daysUntil === 1) return 'Jutro'
  return nextDateLabel(item.daysUntil)
}

function statusClass(item: CareItem): 'ok' | 'soon' | 'overdue' | 'snoozed' {
  if (item.snoozeUntil) return 'snoozed'
  if (item.daysSince === null || item.daysUntil <= 0) return 'overdue'
  if (item.daysUntil <= 2) return 'soon'
  return 'ok'
}

function ringStatus(item: CareItem): 'ok' | 'soon' | 'overdue' {
  if (item.daysSince === null || item.daysUntil <= 0) return 'overdue'
  if (item.daysUntil <= 2) return 'soon'
  return 'ok'
}
</script>

<template>
  <div class="sketch-card">
    <div class="card-head">
      <IconLineChart v-if="plant.templateSpecies" :size="15" />
      <IconWater v-else :size="15" />
      <span class="card-head__label">{{
        plant.templateSpecies ? 'Harmonogram' : 'Pielęgnacja'
      }}</span>
    </div>

    <div class="card-body">
      <PlantCareChart
        v-if="plant.templateSpecies"
        :plant="plant"
        :events="events"
        :snoozes="snoozes"
      />

      <template v-else>
        <p v-if="careItems.length === 0" class="empty-msg">Brak ustawień pielęgnacji</p>
        <ul v-else class="care-list">
          <li v-for="item in careItems" :key="item.type" class="care-item">
            <span class="care-item__icon" :class="`care-item__icon--${item.iconSlot}`">
              <IconWater v-if="item.iconSlot === 'water'" :size="13" />
              <IconFertilizing v-else-if="item.iconSlot === 'fertilize'" :size="13" />
              <IconMisting v-else-if="item.iconSlot === 'mist'" :size="13" />
              <IconCleaning v-else-if="item.iconSlot === 'clean'" :size="13" />
            </span>
            <span class="care-item__label">{{ item.label }}</span>
            <span class="care-item__interval">co {{ item.interval }} dni</span>
            <span class="care-item__next" :class="`care-item__next--${statusClass(item)}`">
              <IconSnooze v-if="item.snoozeUntil" :size="11" class="snooze-icon" />
              <IconProgressRing
                :progress="item.progress"
                :status="ringStatus(item)"
                :size="16"
              />
              {{ nextLabel(item) }}
            </span>
          </li>
        </ul>
      </template>
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
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px dashed var(--line);
  color: var(--ink-2);
  flex-wrap: wrap;
}

.card-head__label {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
  flex: 1;
}

.card-body {
  padding: 10px 12px;
}
.empty-msg {
  color: var(--ink-3);
  font-size: 13px;
  margin: 0;
}

/* ─── Care list (no-template) ────────────────────────────────────────────────── */

.care-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.care-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.care-item__icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.care-item__icon--water {
  background: var(--blue-soft);
  color: var(--blue);
}
.care-item__icon--fertilize {
  background: var(--brown-soft);
  color: var(--brown);
}
.care-item__icon--mist {
  background: var(--mist-soft);
  color: var(--mist);
}
.care-item__icon--clean {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.care-item__label {
  flex: 1;
  color: var(--ink-2);
}
.care-item__interval {
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
}

.care-item__next {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.care-item__next--ok {
  color: var(--accent-deep);
}
.care-item__next--soon {
  color: var(--cond-2);
}
.care-item__next--overdue {
  color: var(--warn);
}
.care-item__next--snoozed {
  color: var(--ink-3);
}

.snooze-icon {
  opacity: 0.7;
}
</style>
