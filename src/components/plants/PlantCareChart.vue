<script setup lang="ts">
import type { CareEvent, Plant, Snooze } from '@/types'
import IconSnooze from '@/components/icons/IconSnooze.vue'
import IconProgressRing from '@/components/icons/IconProgressRing.vue'
import RepottingInfoDialog from '@/components/plants/RepottingInfoDialog.vue'
import { MONTH_SHORT, TYPE_KEY, barHeight, usePlantCareChartData } from '@/composables/usePlantCareChartData'

const props = defineProps<{ plant: Plant; events?: CareEvent[]; snoozes?: Snooze[] }>()

const { currentMonth, template, charts, nextCareLabel, nextCareRing } = usePlantCareChartData(props)
</script>

<template>
  <div v-if="template">
    <div class="charts-wrapper">
      <div v-for="chart in charts" :key="chart.label" class="chart-row">
        <div class="chart-row-head mb-2">
          <div class="d-flex align-center ga-2">
            <div class="legend-dot" :class="`bg-${chart.color}`" />
            <span class="text-caption font-weight-medium text-uppercase">{{ chart.label }}</span>
          </div>
          <span
            v-if="TYPE_KEY[chart.label] && nextCareLabel(TYPE_KEY[chart.label])"
            class="next-care-label"
            :class="{ 'next-care-label--snoozed': nextCareLabel(TYPE_KEY[chart.label])?.snoozed }"
          >
            <IconSnooze v-if="nextCareLabel(TYPE_KEY[chart.label])?.snoozed" :size="10" class="snooze-icon" />
            <IconProgressRing
              v-if="nextCareRing(TYPE_KEY[chart.label])"
              :progress="nextCareRing(TYPE_KEY[chart.label])!.progress"
              :status="nextCareRing(TYPE_KEY[chart.label])!.status"
              :size="14"
            />
            {{ nextCareLabel(TYPE_KEY[chart.label])?.label }}
          </span>
        </div>

        <div class="chart-grid">
          <div
            v-for="(val, i) in chart.values"
            :key="i"
            class="chart-col"
            :class="{ 'chart-col--current': i === currentMonth }"
          >
            <div class="bar-num" :class="{ 'bar-num--zero': val === 0 }">
              {{ val || '' }}
            </div>
            <div class="bar-track" :title="chart.unitLabel(val)">
              <div class="bar" :class="chart.cssClass" :style="{ height: barHeight(val) + '%' }" />
            </div>
            <div class="chart-label text-caption">{{ MONTH_SHORT[i] }}</div>
          </div>
        </div>

        <div class="text-caption text-medium-emphasis mt-1">
          {{ MONTH_SHORT[currentMonth] }}: {{ chart.unitLabel(chart.values[currentMonth]) }}
        </div>
      </div>

      <!-- Przycinanie -->
      <div v-if="template.pruningMonths.length" class="mb-4">
        <div class="d-flex align-center ga-2 mb-2">
          <v-icon size="14" color="warning">mdi-content-cut</v-icon>
          <span class="text-caption font-weight-medium text-uppercase">Przycinanie</span>
        </div>
        <div class="month-chips">
          <span
            v-for="(m, i) in MONTH_SHORT"
            :key="i"
            class="month-chip"
            :class="{
              'month-chip--active-warning': template.pruningMonths.includes(i + 1),
              'month-chip--current': i === currentMonth,
            }"
          >
            {{ m }}
          </span>
        </div>
      </div>

      <!-- Przesadzanie -->
      <div
        v-if="template.repottingMonths.length"
        class="mb-2"
        :class="{ 'repotting-top': !template.pruningMonths.length }"
      >
        <div class="d-flex align-center ga-2 mb-2">
          <v-icon size="14" color="brown">mdi-pot-mix</v-icon>
          <span class="text-caption font-weight-medium text-uppercase">Przesadzanie</span>
          <RepottingInfoDialog :plant="plant" />
        </div>
        <div class="month-chips mb-2">
          <span
            v-for="(m, i) in MONTH_SHORT"
            :key="i"
            class="month-chip"
            :class="{
              'month-chip--active-brown': template.repottingMonths.includes(i + 1),
              'month-chip--current': i === currentMonth,
            }"
            >{{ m }}</span
          >
        </div>
      </div>

      <!-- Czyszczenie -->
      <div v-if="template.cleaningIntervalDays" class="mb-1 cleaning-section">
        <div class="d-flex align-center ga-2 mb-2">
          <v-icon size="14" color="green-darken-1">mdi-leaf-circle</v-icon>
          <span class="text-caption font-weight-medium text-uppercase">Czyszczenie</span>
          <span class="text-caption text-medium-emphasis"
            >co {{ template.cleaningIntervalDays }} dni</span
          >
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-caption text-medium-emphasis">
    Brak danych sezonowych — roślina nie ma przypisanego szablonu gatunku.
  </div>
</template>

<style scoped>
.chart-row {
  padding-bottom: 12px;
}
.chart-row:last-of-type {
  padding-bottom: 0;
}

.chart-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.next-care-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(var(--v-theme-on-surface), 0.55);
  white-space: nowrap;
}
.next-care-label--snoozed {
  color: var(--ink-3);
}
.snooze-icon {
  opacity: 0.7;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
  align-items: end;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.bar-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  color: var(--v-medium-emphasis-opacity, rgba(0, 0, 0, 0.6));
  line-height: 1;
  min-height: 11px;
}

.bar-num--zero {
  visibility: hidden;
}

.chart-col--current .chart-label {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.chart-col--current .bar-track {
  background: rgba(var(--v-theme-primary), 0.12);
}

.bar-track {
  width: 100%;
  height: 80px;
  background: rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  border-radius: 4px;
  transition: height 0.3s ease;
  min-height: 2px;
}

.bar--watering {
  background: rgb(var(--v-theme-info));
}
.bar--fertilizing {
  background: rgb(var(--v-theme-success));
}
.bar--misting {
  background: #00897b;
}

.chart-label {
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bg-info {
  background: rgb(var(--v-theme-info));
}
.bg-success {
  background: rgb(var(--v-theme-success));
}
.bg-teal {
  background: #00897b;
}

.month-chips {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
}

.month-chip {
  text-align: center;
  font-size: 10px;
  padding: 4px 2px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.month-chip--active-warning {
  background: rgba(var(--v-theme-warning), 0.18);
  color: rgb(var(--v-theme-warning));
  font-weight: 700;
}

.month-chip--active-brown {
  background: rgba(121, 85, 72, 0.15);
  color: #795548;
  font-weight: 700;
}

.month-chip--current {
  outline: 1.5px solid rgba(var(--v-theme-primary), 0.5);
}

.repotting-top {
  margin-top: 4px;
}
.cleaning-section {
  margin-top: 16px;
}

@media (min-width: 960px) {
  .bar-num {
    font-size: 11px;
    min-height: 14px;
  }
}

@media (min-width: 960px) {
  .bar-track {
    height: 120px;
  }
}

@media (min-width: 960px) {
  .chart-label {
    font-size: 12px;
  }

  .chart-grid {
    gap: 6px;
  }

  .month-chip {
    font-size: 12px;
    padding: 6px 4px;
  }
}
</style>
