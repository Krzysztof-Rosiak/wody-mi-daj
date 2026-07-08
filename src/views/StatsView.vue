<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { usePlantsStore } from '@/stores/plants'
import { useStats } from '@/composables/useStats'
import {
  barOptions,
  lineOptions,
  conditionOptions,
  stackedBarOptions,
  roomBarOptions,
  registerStackedTotalsPlugin,
} from '@/composables/useStatsCharts'
import StatsOverviewTiles from '@/components/stats/StatsOverviewTiles.vue'
import StatsCareByDay from '@/components/stats/StatsCareByDay.vue'
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'
import IconBarChart from '@/components/icons/IconBarChart.vue'
import IconFertilizing from '@/components/icons/IconFertilizing.vue'
import IconHouse from '@/components/icons/IconHouse.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
)
registerStackedTotalsPlugin()

const plantsStore = usePlantsStore()
const {
  load,
  loading,
  totalPlants,
  eventsThisMonth,
  newPlantsLastYear,
  avgCondition,
  leastCaredPlant,
  getChartData,
  CARE_TYPE_CONFIG,
  plantsOverTimeData,
  careByTypeData,
  careByMonthData,
  plantsByRoomData,
  conditionTrendData,
  hasSurveyData,
} = useStats()

const roomChartHeight = computed(() =>
  Math.max(120, (plantsByRoomData.value.labels?.length ?? 1) * 44),
)

onMounted(load)
</script>

<template>
  <div class="stats-page">
    <div class="page-head">
      <div class="page-caption">Moje rośliny</div>
      <h1 class="page-title">Statystyki</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else-if="plantsStore.plants.length">
      <StatsOverviewTiles
        :total-plants="totalPlants"
        :new-plants-last-year="newPlantsLastYear"
        :events-this-month="eventsThisMonth"
        :avg-condition="avgCondition"
        :least-cared-plant="leastCaredPlant"
      />

      <div class="sketch-card">
        <div class="card-head">
          <IconBarChart :size="15" />
          <span class="card-head__label">Zabiegi wg miesiąca</span>
        </div>
        <div class="card-body">
          <div class="chart-h220">
            <Bar :data="careByMonthData" :options="stackedBarOptions" />
          </div>
        </div>
      </div>

      <div class="sketch-card">
        <div class="card-head">
          <IconBarChart :size="15" />
          <span class="card-head__label">Liczba roślin w czasie</span>
        </div>
        <div class="card-body">
          <div class="chart-h180">
            <Line :data="plantsOverTimeData" :options="lineOptions" />
          </div>
        </div>
      </div>

      <StatsCareByDay :care-type-config="CARE_TYPE_CONFIG" :get-chart-data="getChartData" />

      <div class="two-col two-col--stretch">
        <div class="sketch-card sketch-card--flex">
          <div class="card-head">
            <IconFertilizing :size="15" />
            <span class="card-head__label">Zabiegi wg typu</span>
          </div>
          <div class="card-body card-body--fill">
            <div v-if="careByTypeData.labels?.length" class="chart-fill">
              <Bar :data="careByTypeData" :options="barOptions" />
            </div>
            <div v-else class="card-empty">Brak zabiegów w tym miesiącu</div>
          </div>
        </div>

        <div class="sketch-card">
          <div class="card-head">
            <IconHouse :size="15" />
            <span class="card-head__label">Roślinki wg pokoju</span>
          </div>
          <div class="card-body">
            <div :style="`height: ${roomChartHeight}px`">
              <Bar :data="plantsByRoomData" :options="roomBarOptions" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasSurveyData" class="sketch-card">
        <div class="card-head card-head--warn">
          <IconClipboard :size="15" />
          <span class="card-head__label">Średnia kondycja z ankiet — 6 mies.</span>
        </div>
        <div class="card-body">
          <div class="chart-h180">
            <Line :data="conditionTrendData" :options="conditionOptions" />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <IconPlantBrand :size="48" class="empty-icon" />
      <div class="empty-title">Brak danych</div>
      <div class="empty-sub">Dodaj rośliny, aby zobaczyć statystyki</div>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  margin-bottom: 2px;
}
.page-title {
  font-family: 'Lato', sans-serif;
  font-size: 52px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--line);
  border-top-color: var(--accent-deep);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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
.card-head--warn {
  color: var(--warn);
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

.card-empty {
  padding: 16px 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.sketch-card--flex {
  display: flex;
  flex-direction: column;
}
.card-body--fill {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}
.chart-fill {
  flex: 1;
  min-height: 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.empty-icon {
  color: var(--accent-deep);
  opacity: 0.3;
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
  letter-spacing: 0.06em;
  color: var(--ink-3);
}
.chart-h220 { height: 220px; }
.chart-h180 { height: 180px; }

@media (max-width: 400px) {
  .page-title {
    font-size: 36px;
  }
}

@media (min-width: 600px) {
  .two-col {
    grid-template-columns: 1fr 1fr;
  }
  .two-col--stretch {
    align-items: stretch;
  }
}
</style>
