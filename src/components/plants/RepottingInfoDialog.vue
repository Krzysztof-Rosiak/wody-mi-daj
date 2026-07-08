<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { getCategoryForPlant } from '@/composables/usePlantSchedule'
import { useCareEventsStore } from '@/stores/careEvents'
import { useRepottingDismissalsStore } from '@/stores/repottingDismissals'
import { formatDatePl } from '@/utils/date'
import type { Plant } from '@/types'
import IconInfo from '@/components/icons/IconInfo.vue'

const props = defineProps<{ plant: Plant }>()

const careEventsStore = useCareEventsStore()
const repottingDismissalsStore = useRepottingDismissalsStore()
const currentYear = new Date().getFullYear()

const repotCategory = computed(() => getCategoryForPlant(props.plant))

const showRepotInfo = ref(false)
const lastRepottingDate = ref<Date | null>(null)
const dismissedUntilYear = ref<number | null>(null)

onMounted(async () => {
  const [all, dismissals] = await Promise.all([
    careEventsStore.fetchAll(),
    repottingDismissalsStore.getAll(),
  ])
  const plantId = props.plant.id as number
  const lastEvent = all
    .filter((e) => e.plantId === plantId && e.type === 'repotting')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  if (lastEvent) lastRepottingDate.value = new Date(lastEvent.date)
  const dismissal = dismissals.find(
    (d) => d.plantId === props.plant.id && d.dismissedUntilYear > currentYear,
  )
  if (dismissal) dismissedUntilYear.value = dismissal.dismissedUntilYear
})

const repotStatusLabel = computed(() => {
  if (dismissedUntilYear.value) return `Przesadzanie pominięte do ${dismissedUntilYear.value} r.`
  if (lastRepottingDate.value)
    return `Ostatnio przesadzona: ${formatDatePl(lastRepottingDate.value, { year: 'numeric', month: 'long', day: 'numeric' })}`
  return null
})

</script>

<template>
  <button
    v-if="repotCategory"
    class="info-btn"
    title="Info o przesadzaniu"
    @click="showRepotInfo = true"
  >
    <IconInfo :size="15" class="info-btn__icon" />
  </button>

  <v-dialog v-model="showRepotInfo" max-width="480" scrollable class="repot-dialog">
    <v-card v-if="repotCategory" class="repot-modal">
      <v-card-title class="repot-modal__title">
        <div class="repot-modal__title-left">
          <div class="repot-modal__title-row">
            <v-icon size="16" color="brown">mdi-pot-mix</v-icon>
            <span>Przesadzanie</span>
          </div>
          <span class="repot-modal__category">{{ repotCategory.name }}</span>
        </div>
        <v-btn
          icon
          size="small"
          variant="text"
          class="repot-modal__close"
          @click="showRepotInfo = false"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="repot-modal__body">
        <div class="repot-modal__section-label">Ziemia</div>
        <p class="repot-modal__text">{{ repotCategory.soilDescription }}</p>

        <div class="repot-modal__section-label mt-4">Jak sprawdzić czy czas na przesadzenie?</div>
        <ul class="repot-modal__hints">
          <li v-for="hint in repotCategory.repottingCheckHints" :key="hint">{{ hint }}</li>
        </ul>

        <template v-if="repotStatusLabel">
          <div class="repot-modal__section-label mt-4">Status</div>
          <p class="repot-modal__text">{{ repotStatusLabel }}</p>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  border-radius: 4px;
  transition: opacity 0.15s;
}
.info-btn:hover {
  opacity: 1;
}
.info-btn__icon {
  color: #795548;
}

.repot-dialog {
  margin: 0 12px;
}

.repot-modal {
  overflow-x: hidden;
}

.repot-modal__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 8px 12px 16px;
}

.repot-modal__title-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.repot-modal__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.repot-modal__close {
  flex-shrink: 0;
  margin-top: -2px;
}

.repot-modal__category {
  font-size: 10px;
  font-weight: 400;
  padding: 2px 8px;
  border: 1px solid rgba(121, 85, 72, 0.4);
  border-radius: 8px;
  background: rgba(121, 85, 72, 0.08);
  color: #795548;
  white-space: nowrap;
  text-transform: none;
  letter-spacing: 0;
}

.repot-modal__body {
  padding: 12px 16px 20px;
}

.repot-modal__section-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #795548;
  margin-bottom: 6px;
}

.repot-modal__text {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.8);
  margin: 0;
}

.repot-modal__hints {
  font-size: 13px;
  line-height: 1.9;
  color: rgba(var(--v-theme-on-surface), 0.8);
  padding-left: 20px;
  margin: 0;
}
</style>
