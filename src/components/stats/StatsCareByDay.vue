<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { ChartData } from 'chart.js'
import IconWater from '@/components/icons/IconWater.vue'
import { barOptions } from '@/composables/useStatsCharts'
import { type ChartCareType } from '@/composables/useStats'

const props = defineProps<{
  careTypeConfig: Record<ChartCareType, { label: string; color: string }>
  getChartData: (type: ChartCareType) => ChartData<'bar'>
}>()

const selectedType = ref<ChartCareType>('watering')
const activeChartData = computed(() => props.getChartData(selectedType.value))
</script>

<template>
  <div class="sketch-card">
    <div class="card-head">
      <IconWater :size="15" />
      <span class="card-head__label">Zabiegi — ostatnie 30 dni</span>
    </div>
    <div class="care-tabs">
      <button
        v-for="(cfg, type) in careTypeConfig"
        :key="type"
        class="care-tab"
        :class="{ 'care-tab--active': selectedType === type }"
        :style="selectedType === type ? `--tab-color: ${cfg.color}` : ''"
        @click="selectedType = type"
      >
        {{ cfg.label }}
      </button>
    </div>
    <div class="card-body">
      <div class="chart-h180">
        <Bar :data="activeChartData" :options="barOptions" />
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
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px dashed var(--line);
  color: var(--ink-2);
}

.card-head__label {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
}

.card-body {
  padding: 10px 12px;
}

.care-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px 0;
}

.care-tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1.5px solid var(--line);
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: all 0.15s;
}
.care-tab:hover {
  border-color: var(--ink-2);
  color: var(--ink-2);
}
.care-tab--active {
  background: var(--tab-color, rgba(33, 150, 243, 0.2));
  border-color: var(--tab-color, rgba(33, 150, 243, 0.75));
  color: var(--ink);
  font-weight: 700;
}
.chart-h180 { height: 180px; }
</style>
