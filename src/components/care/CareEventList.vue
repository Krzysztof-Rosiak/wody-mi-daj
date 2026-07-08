<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CARE_TYPE_LABELS, CARE_TYPE_BG, CARE_TYPE_FG, type CareEvent, type CareType } from '@/types'
import { formatDatePl } from '@/utils/date'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import IconTrash from '@/components/icons/IconTrash.vue'

const props = defineProps<{
  events: CareEvent[]
}>()

const emit = defineEmits<{
  remove: [id: number]
}>()

const confirmId = ref<number | null>(null)
const activeFilter = ref<CareType | null>(null)
const showAll = ref(false)

watch(activeFilter, () => { showAll.value = false })

const presentTypes = computed(() => {
  const types = new Set<CareType>()
  for (const e of props.events) types.add(e.type)
  return [...types]
})

const filteredEvents = computed(() =>
  activeFilter.value ? props.events.filter((e) => e.type === activeFilter.value) : props.events,
)

const PAGE_SIZE = 20

const visibleEvents = computed(() => {
  if (showAll.value || filteredEvents.value.length <= PAGE_SIZE) return filteredEvents.value
  return filteredEvents.value.slice(0, PAGE_SIZE)
})

const hasMore = computed(() => !showAll.value && filteredEvents.value.length > PAGE_SIZE)

const groupedByMonth = computed(() => {
  const groups = new Map<string, { label: string; events: CareEvent[] }>()
  for (const event of visibleEvents.value) {
    const d = new Date(event.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups.has(key)) {
      const label = formatDatePl(d, { month: 'long', year: 'numeric' })
      groups.set(key, { label, events: [] })
    }
    groups.get(key)!.events.push(event)
  }
  return [...groups.entries()].map(([key, g]) => ({ key, ...g }))
})

function askRemove(id: number) {
  confirmId.value = id
}

function confirmRemove() {
  if (confirmId.value !== null) emit('remove', confirmId.value)
  confirmId.value = null
}


</script>

<template>
  <div v-if="events.length === 0" class="empty">
    Brak historii pielęgnacji
  </div>

  <template v-else>
    <div v-if="presentTypes.length > 1" class="filter-bar">
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': activeFilter === null }"
        @click="activeFilter = null"
      >Wszystkie</button>
      <button
        v-for="type in presentTypes"
        :key="type"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeFilter === type }"
        :style="activeFilter === type ? `color:${CARE_TYPE_FG[type]};border-color:${CARE_TYPE_FG[type]};background:${CARE_TYPE_BG[type]}` : ''"
        @click="activeFilter = activeFilter === type ? null : type"
      >
        <span class="filter-dot" :style="`background:${CARE_TYPE_BG[type]};border-color:${CARE_TYPE_FG[type]}`"></span>
        {{ CARE_TYPE_LABELS[type] }}
      </button>
    </div>

  <div class="event-list">
    <div v-for="group in groupedByMonth" :key="group.key" class="month-group">
      <div class="month-header">
        <span class="month-label">{{ group.label }}</span>
        <span class="month-count">{{ group.events.length }}</span>
      </div>
      <div v-for="event in group.events" :key="event.id" class="event-row">
        <div class="event-dot" :style="`background:${CARE_TYPE_BG[event.type]};color:${CARE_TYPE_FG[event.type]};border-color:${CARE_TYPE_FG[event.type]}`"></div>
        <div class="event-info">
          <span class="event-type">{{ CARE_TYPE_LABELS[event.type] }}</span>
          <span class="event-date">{{ formatDatePl(new Date(event.date), { day: 'numeric', month: 'short' }) }}</span>
          <div v-if="event.notes" class="event-notes">{{ event.notes }}</div>
        </div>
        <button class="del-btn" @click="askRemove(event.id as number)">
          <IconTrash :size="13" />
        </button>
      </div>
    </div>
  </div>
  <button v-if="hasMore" class="show-more-btn" @click="showAll = true">
    Pokaż wszystkie
    <span class="show-more-hint">(+ {{ filteredEvents.length - visibleEvents.length }} ukrytych)</span>
  </button>
  </template>

  <ConfirmDialog
    :model-value="confirmId !== null"
    title="Usuń wpis"
    body="Czy na pewno chcesz usunąć ten wpis z historii? Operacji nie można cofnąć."
    @update:model-value="confirmId = null"
    @confirm="confirmRemove"
  >
    <template #icon>
      <IconTrash :size="16" stroke="var(--warn)" />
    </template>
  </ConfirmDialog>
</template>

<style scoped>
.empty {
  padding: 24px 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-3);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 30%, transparent);
  margin-bottom: 4px;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  background: transparent;
  border: 1.3px solid color-mix(in oklab, var(--ink-3) 50%, transparent);
  border-radius: 8px 10px 9px 11px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.filter-btn:hover {
  background: var(--paper-2);
  color: var(--ink-2);
}
.filter-btn--active {
  background: var(--paper-2);
  color: var(--ink);
  border-color: var(--ink-3);
  font-weight: 700;
}

.filter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  flex-shrink: 0;
}


.event-list { display: flex; flex-direction: column; }

.month-group { margin-bottom: 4px; }
.month-group:last-child { margin-bottom: 0; }

.month-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 5px;
  border-bottom: 1.5px solid var(--line);
  margin-bottom: 2px;
}

.month-label {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: var(--ink-2);
  text-transform: capitalize;
}

.month-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--ink-3);
  border: 1.2px solid var(--ink-3);
  border-radius: 6px;
  padding: 1px 5px;
}

.event-row {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 25%, transparent);
}
.event-row:last-child { border-bottom: 0; }

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid currentColor;
}

.event-info {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.event-type {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.2;
}

.event-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-3);
}

.event-notes {
  width: 100%;
  font-family: 'Lato', sans-serif;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.3;
}

.del-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  color: var(--ink-3);
  flex-shrink: 0;
}
.del-btn:hover { border-color: var(--warn); color: var(--warn); background: var(--warn-soft); }

.show-more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px 14px;
  width: 100%;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-3);
  background: transparent;
  border: 1.3px dashed color-mix(in oklab, var(--ink-3) 50%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.show-more-btn:hover {
  color: var(--ink-2);
  border-color: var(--ink-3);
  background: var(--paper-2);
}
.show-more-hint {
  color: var(--ink-3);
  font-size: 10px;
}

</style>
