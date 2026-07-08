<script setup lang="ts">
import { computed } from 'vue'
import { formatDatePl } from '@/utils/date'
import IconChevronRight from '@/components/icons/IconChevronRight.vue'
import IconChevronLeft from '@/components/icons/IconChevronLeft.vue'

const DAY_SHORT = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb']

export interface CalendarDay {
  date: Date
  offset: number
  isToday: boolean
  isPast: boolean
  count: number
}

const props = defineProps<{ days: CalendarDay[]; selectedOffset?: number }>()
const emit = defineEmits<{ select: [offset: number]; prev: []; next: []; today: [] }>()

const todayVisible = computed(() => props.days.some((d) => d.isToday))

const monthLabel = computed(() => {
  if (!props.days.length) return ''
  const mid = props.days[Math.floor(props.days.length / 2)]
  const first = props.days[0]
  const last = props.days[props.days.length - 1]
  const m1 = first.date.getMonth()
  const m2 = last.date.getMonth()
  if (m1 !== m2) {
    const fmt = (d: Date) => formatDatePl(d, { month: 'long' }).slice(0, 3)
    return `${fmt(first.date)} – ${fmt(last.date)} ${last.date.getFullYear()}`
  }
  return `${formatDatePl(mid.date, { month: 'long' })} ${mid.date.getFullYear()}`
})
</script>

<template>
  <div class="week-card">
    <div class="week-month">
      {{ monthLabel }}
      <button v-if="!todayVisible" class="week-today-btn" @click="emit('today')">Dziś</button>
    </div>

    <div class="week">
      <button class="week-arrow" aria-label="Poprzedni tydzień" @click="emit('prev')">
        <IconChevronLeft :size="14" />
      </button>

      <button
        v-for="day in days"
        :key="day.offset"
        class="cal-day"
        :class="{
          'cal-day--today': day.isToday && day.offset === props.selectedOffset,
          'cal-day--today-unselected': day.isToday && day.offset !== props.selectedOffset,
          'cal-day--selected': !day.isToday && day.offset === props.selectedOffset,
        }"
        @click="emit('select', day.offset)"
      >
        <div class="d-name">{{ DAY_SHORT[day.date.getDay()] }}</div>
        <div class="d-num">{{ day.date.getDate() }}</div>
        <span
          class="d-count"
          :class="{ empty: day.count === 0, 'empty-circle': day.isToday && day.count === 0 }"
        >
          {{ (day.isToday && day.count === 0) ? '' : day.count > 0 ? day.count : '·' }}
        </span>
      </button>

      <button class="week-arrow" aria-label="Następny tydzień" @click="emit('next')">
        <IconChevronRight :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.week-card {
  background: var(--paper);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  padding: 16px 18px;
  margin-bottom: 22px;
  box-shadow: var(--shadow-card);
}

.week-month {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 10px;
}

.week-today-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--accent-deep);
  background: var(--accent-soft);
  border: 1px solid var(--accent-deep);
  border-radius: 6px 8px 7px 9px;
  padding: 1px 7px;
  cursor: pointer;
}

.week {
  display: grid;
  grid-template-columns: 28px repeat(7, 1fr) 28px;
  align-items: center;
  gap: 2px;
}

.week-arrow {
  border: 1.3px solid var(--line);
  background: transparent;
  width: 24px;
  height: 24px;
  border-radius: 8px 10px 9px 11px;
  cursor: pointer;
  color: var(--ink-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}

.week-arrow:hover {
  background: var(--paper-2);
}

.cal-day {
  text-align: center;
  padding: 6px 2px 8px;
  border-radius: 10px 12px 11px 13px / 13px 11px 12px 10px;
  cursor: pointer;
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: background 0.12s;
}

.cal-day:hover:not(.cal-day--today) {
  background: var(--paper-2);
}

.cal-day--selected {
  background: var(--paper-2);
  outline: 1.5px solid var(--ink-3);
  outline-offset: -1px;
}

.d-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: .15em;
  text-transform: uppercase;
  line-height: 1;
}

.d-num {
  font-family: 'Lato', sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  margin-top: 2px;
}

.d-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1.3px solid var(--line);
  background: var(--paper);
  border-radius: 10px;
  font-family: 'Lato', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-2);
  margin-top: 2px;
  line-height: 1;
}

.d-count.empty {
  border-style: dashed;
  color: transparent;
}
.d-count.empty-circle {
  border-style: solid;
  min-width: 14px;
  height: 14px;
  padding: 0;
  border-radius: 50%;
  opacity: 0.4;
}

.cal-day--today { background: var(--accent-deep); }
.cal-day--today .d-name { color: var(--accent-soft); }
.cal-day--today .d-num  { color: var(--paper); }
.cal-day--today .d-count {
  background: var(--accent-soft);
  border-color: var(--accent-soft);
  color: var(--accent-deep);
}

.cal-day--today-unselected { background: var(--accent-soft); }
.cal-day--today-unselected .d-name { color: var(--accent-deep); }
.cal-day--today-unselected .d-num  { color: var(--accent-deep); }
.cal-day--today-unselected .d-count {
  border-color: var(--accent-deep);
  color: var(--accent-deep);
}

@media (min-width: 400px) {
  .week {
    grid-template-columns: 32px repeat(7, 1fr) 32px;
    gap: 4px;
  }
}

@media (min-width: 400px) {
  .week-arrow { width: 28px; height: 28px; }
}

@media (min-width: 400px) {
  .d-num { font-size: 26px; }
}
</style>
