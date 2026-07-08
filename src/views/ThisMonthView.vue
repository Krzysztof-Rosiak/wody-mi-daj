<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'
import { useSeasonalTasks } from '@/composables/useSeasonalTasks'
import MonthlyTaskSection from '@/components/care/MonthlyTaskSection.vue'
import RepottingSection from '@/components/care/RepottingSection.vue'
import MonthlyDoneSection from '@/components/care/MonthlyDoneSection.vue'
import type { Plant } from '@/types'
import IconClose from '@/components/icons/IconClose.vue'
import IconCheck from '@/components/icons/IconCheck.vue'
import IconPruning from '@/components/icons/IconPruning.vue'

const plantsStore = usePlantsStore()
const careEventsStore = useCareEventsStore()

const {
  toRepot,
  toPrune,
  doneRepottingIds,
  donePruningIds,
  currentMonth,
  dismissRepotting,
  dismissPruning,
  load: loadSeasonalTasks,
} = useSeasonalTasks()

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]
const MONTH_NAMES_LOC = [
  'styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu',
  'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu',
]

const currentMonthName = MONTH_NAMES[currentMonth]
const currentMonthNameLoc = MONTH_NAMES_LOC[currentMonth]

const repotExpanded = ref(true)
const pruneExpanded = ref(true)
const doneExpanded = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('')
const snackbarIcon = ref('')

onMounted(async () => {
  if (!plantsStore.plants.length) await plantsStore.fetchAll()
})

const doneItems = computed(() => [
  ...plantsStore.plants
    .filter((p) => doneRepottingIds.value.has(p.id as number))
    .map((plant) => ({ plant, kind: 'repotting' as const })),
  ...plantsStore.plants
    .filter((p) => donePruningIds.value.has(p.id as number))
    .map((plant) => ({ plant, kind: 'pruning' as const })),
])
const hasDone = computed(() => doneItems.value.length > 0)

async function markDone(plant: Plant, type: 'repotting' | 'pruning') {
  await careEventsStore.add({ plantId: plant.id as number, type, date: new Date() })
  await loadSeasonalTasks()
  if (type === 'repotting') {
    snackbarText.value = `Przesadzono: ${plant.name}`
    snackbarColor.value = 'brown'
    snackbarIcon.value = 'mdi-pot-mix'
  } else {
    snackbarText.value = `Przycięto: ${plant.name}`
    snackbarColor.value = 'warning'
    snackbarIcon.value = 'mdi-content-cut'
  }
  snackbar.value = true
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <div class="date-weekday">W tym miesiącu</div>
        <h1 class="date-title">{{ currentMonthName }}</h1>
      </div>
    </div>

    <RepottingSection
      v-model:expanded="repotExpanded"
      :plants="toRepot"
      :empty-text="`Brak roślin do przesadzenia w ${currentMonthNameLoc}.`"
      @dismiss="dismissRepotting"
      @done="markDone($event, 'repotting')"
    />

    <!-- Przycinanie -->
    <MonthlyTaskSection
      label="Przycinanie"
      color="var(--mist)"
      :plants="toPrune"
      :empty-text="`Brak roślin do przycinania w ${currentMonthNameLoc}.`"
      :expanded="pruneExpanded"
      @update:expanded="pruneExpanded = $event"
    >
      <template #icon>
        <IconPruning :size="18" stroke="var(--mist)" class="icon-shrink" />
      </template>
      <template #actions="{ plant }">
        <div class="row-actions">
          <button class="action-btn action-btn--dismiss" :aria-label="`Pomiń przycinanie ${plant.name}`" @click="dismissPruning(plant.id as number)">
            <IconClose :size="18" />
          </button>
          <button class="action-btn action-btn--mist" :aria-label="`Przytnij ${plant.name}`" @click="markDone(plant, 'pruning')">
            <IconCheck :size="20" />
          </button>
        </div>
      </template>
    </MonthlyTaskSection>

    <MonthlyDoneSection v-if="hasDone" v-model:expanded="doneExpanded" :items="doneItems" />

    <v-snackbar v-model="snackbar" :timeout="1200" location="bottom" variant="tonal" :color="snackbarColor">
      <div class="d-flex align-center ga-2">
        <v-icon size="18">{{ snackbarIcon }}</v-icon>
        {{ snackbarText }}
      </div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 22px; }

.date-weekday {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.date-title {
  font-family: 'Caveat', cursive;
  font-size: 52px;
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  margin: 0;
}

/* ── Action buttons (shared with MonthlyTaskSection slot content) ── */
.row-actions { display: flex; flex-shrink: 0; gap: 6px; }

.action-btn {
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--line);
  background: var(--paper);
  border-radius: 9px 11px 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.action-btn:hover { background: var(--accent-deep); border-color: var(--accent-deep); color: var(--paper); }

.action-btn--dismiss { background: transparent; border-color: var(--line); color: var(--ink-3); opacity: 0.6; }
.action-btn--dismiss:hover { opacity: 1; background: var(--paper-2); border-color: var(--ink-3); color: var(--ink-2); }
.action-btn--mist { background: var(--mist-soft); border-color: var(--mist); color: var(--mist); }

.icon-shrink { flex-shrink: 0; }

@media (max-width: 400px) {
  .date-title { font-size: 36px; }
}
</style>
