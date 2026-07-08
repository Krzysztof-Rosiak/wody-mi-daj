<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useRoomsStore } from '@/stores/rooms'
import { usePlantTasks, toLocalDateKey } from '@/composables/usePlantTasks'
import { useTodayCalendar } from '@/composables/useTodayCalendar'
import { useSeasonalTasks } from '@/composables/useSeasonalTasks'
import { CARE_TYPE_LABELS } from '@/types'
import type { Plant, PlantSurvey, SnoozedCareType } from '@/types'
import TaskSection from '@/components/care/TaskSection.vue'
import CalendarStrip from '@/components/care/CalendarStrip.vue'
import SurveyForm from '@/components/plants/SurveyForm.vue'
import TodayWelcomeScreen from '@/components/today/TodayWelcomeScreen.vue'
import TodayDatePickerDialog from '@/components/today/TodayDatePickerDialog.vue'
import TodayObservationsSection from '@/components/today/TodayObservationsSection.vue'
import RoomGroupedTaskList from '@/components/today/RoomGroupedTaskList.vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'
import { groupByRoom } from '@/composables/groupByRoom'
import IconCheckCircle from '@/components/icons/IconCheckCircle.vue'
import IconClock from '@/components/icons/IconClock.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconChevronRight from '@/components/icons/IconChevronRight.vue'
import IconWater from '@/components/icons/IconWater.vue'
import IconFertilizing from '@/components/icons/IconFertilizing.vue'
import IconMisting from '@/components/icons/IconMisting.vue'
import IconCleaning from '@/components/icons/IconCleaning.vue'
import IconRepotting from '@/components/icons/IconRepotting.vue'

const plantsStore = usePlantsStore()
const roomsStore = useRoomsStore()
const {
  loading,
  load,
  markDone,
  markCombinedDone,
  snoozeTask,
  saveSurvey: saveSurveyTask,
  wateringOnlyTasks,
  fertilizingOnlyTasks,
  combinedTasks,
  mistingTasks,
  cleaningTasks,
  surveyTasks,
  totalTasks,
  upcomingTasks,
  upcomingByDay,
  doneByDay,
  todayDone,
  eventsByDay,
} = usePlantTasks()

const surveyFormPlant = ref<Plant | null>(null)

async function handleSaveSurvey(survey: Omit<PlantSurvey, 'id'>) {
  await saveSurveyTask(survey)
  surveyFormPlant.value = null
}

const { seasonalCount } = useSeasonalTasks()

async function handleCombinedDone(plantId: number) {
  await markCombinedDone(plantId)
}

async function handleCombinedSnooze(plantId: number, _type: SnoozedCareType, until: Date) {
  await snoozeTask(plantId, 'watering', until)
  await snoozeTask(plantId, 'fertilizing', until)
}

onMounted(load)

const doneExpanded = ref(false)

const {
  selectedOffset,
  calendarDialog,
  pickedDate,
  selectDay,
  shiftWindow,
  goToToday,
  openCalendarDialog,
  confirmPickedDate,
  selectedDayLabel,
  calendarDays,
  todayWeekday,
  todayDate,
} = useTodayCalendar({ doneByDay, upcomingByDay, totalTasks })

const plantById = computed(() => new Map(plantsStore.plants.map((p) => [p.id, p])))

const selectedDayEvents = computed(() => {
  if (selectedOffset.value >= 0) return []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(today)
  target.setDate(today.getDate() + selectedOffset.value)
  const key = toLocalDateKey(target)
  return (eventsByDay.value.get(key) ?? [])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => ({ event: e, plant: plantById.value.get(e.plantId) }))
    .filter((item) => item.plant !== undefined)
})

const selectedDayUpcoming = computed(() => {
  if (selectedOffset.value <= 0) return []
  return upcomingTasks.value.filter((t) => t.daysUntil === selectedOffset.value)
})

const selectedDayUpcomingGroups = computed(() =>
  groupByRoom(selectedDayUpcoming.value, roomsStore.allRooms),
)
const selectedDayEventsGroups = computed(() =>
  groupByRoom(
    selectedDayEvents.value.map((e) => ({ ...e, plant: e.plant! })),
    roomsStore.allRooms,
  ),
)
const todayDoneGroups = computed(() =>
  groupByRoom(
    todayDone.value.map((e) => ({ ...e, plant: e.plant! })),
    roomsStore.allRooms,
  ),
)


</script>

<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- Page header -->
      <div v-if="plantsStore.plants.length" class="page-head">
        <div class="date-block">
          <div class="date-weekday">{{ todayWeekday }}</div>
          <h1 class="date-title">{{ todayDate }}</h1>
        </div>
        <button class="icon-btn" aria-label="Otwórz kalendarz" @click="openCalendarDialog">
          <IconCalendar :size="18" />
        </button>
      </div>

      <!-- Calendar strip -->
      <CalendarStrip
        v-if="plantsStore.plants.length"
        :days="calendarDays"
        :selected-offset="selectedOffset"
        @select="selectDay"
        @prev="shiftWindow(-7)"
        @next="shiftWindow(7)"
        @today="goToToday"
      />

      <!-- Date picker dialog -->
      <TodayDatePickerDialog
        v-model="calendarDialog"
        :picked-date="pickedDate"
        @update:picked-date="pickedDate = $event"
        @confirm="confirmPickedDate"
      />

      <!-- Past day -->
      <template v-if="plantsStore.plants.length && selectedOffset < 0">
        <div class="day-label mb-3">{{ selectedDayLabel }}</div>
        <div class="sketch-card">
          <div class="card-head">
            <IconCheckCircle :size="18" stroke="#1D7A45" class="icon-shrink" />
            <span class="card-head__label card-head__label--green">Wykonano</span>
            <span v-if="selectedDayEvents.length" class="card-head__pill card-head__pill--green">
              {{ selectedDayEvents.length }}
            </span>
          </div>
          <div class="card-body card-body--list">
            <template v-if="selectedDayEvents.length">
              <RoomGroupedTaskList
                :groups="selectedDayEventsGroups"
                :item-key="(item) => item.event.id"
              >
                <template #tag="{ item }">
                  <span class="care-tag" :class="`care-tag--${item.event.type}`">
                    {{ CARE_TYPE_LABELS[item.event.type] }}
                  </span>
                </template>
              </RoomGroupedTaskList>
            </template>
            <div v-else class="day-empty">
              <IconCalendar :size="16" />
              Brak zarejestrowanej pielęgnacji tego dnia.
            </div>
          </div>
        </div>
      </template>

      <!-- Future day -->
      <template v-else-if="selectedOffset > 0">
        <div class="day-label mb-3">{{ selectedDayLabel }}</div>
        <div class="sketch-card">
          <div class="card-head">
            <IconClock :size="18" stroke="var(--blue)" class="icon-shrink" />
            <span class="card-head__label card-head__label--blue">Zaplanowano</span>
            <span v-if="selectedDayUpcoming.length" class="card-head__pill card-head__pill--blue">
              {{ selectedDayUpcoming.length }}
            </span>
          </div>
          <div class="card-body card-body--list">
            <template v-if="selectedDayUpcoming.length">
              <RoomGroupedTaskList
                :groups="selectedDayUpcomingGroups"
                :item-key="(task) => task.plant.id"
              >
                <template #tag="{ item: task }">
                  <span class="care-tag" :class="`care-tag--${task.careType}`">
                    {{
                      task.careType === 'combined'
                        ? 'Podlewanie + nawożenie'
                        : CARE_TYPE_LABELS[task.careType as keyof typeof CARE_TYPE_LABELS]
                    }}
                  </span>
                </template>
              </RoomGroupedTaskList>
            </template>
            <div v-else class="day-empty">
              <IconCalendar :size="16" />
              Brak zaplanowanej pielęgnacji tego dnia.
            </div>
          </div>
        </div>
      </template>

      <!-- Today -->
      <template v-else-if="plantsStore.plants.length">
        <!-- Do zrobienia -->
        <div class="sketch-card">
          <div class="card-head">
            <IconClock :size="18" stroke="var(--warn)" class="icon-shrink" />
            <span class="card-head__label card-head__label--warn">DO ZROBIENIA</span>
            <span v-if="totalTasks > 0" class="card-head__pill card-head__pill--warn">
              {{ totalTasks }}
            </span>
          </div>
          <div class="card-body">
            <template v-if="totalTasks > 0">
              <TaskSection
                v-if="combinedTasks.length"
                :tasks="combinedTasks"
                :icon="IconWater"
                label="Podlewanie + nawożenie"
                color="blue"
                care-type="watering"
                theme="combined"
                @done="(plantId: number) => handleCombinedDone(plantId)"
                @snooze="handleCombinedSnooze"
              />
              <TaskSection
                v-if="wateringOnlyTasks.length"
                :tasks="wateringOnlyTasks"
                :icon="IconWater"
                label="Podlewanie"
                color="blue"
                care-type="watering"
                @done="markDone"
                @snooze="snoozeTask"
              />
              <TaskSection
                v-if="fertilizingOnlyTasks.length"
                :tasks="fertilizingOnlyTasks"
                :icon="IconFertilizing"
                label="Nawożenie"
                color="orange-darken-2"
                care-type="fertilizing"
                @done="markDone"
                @snooze="snoozeTask"
              />
              <TaskSection
                v-if="mistingTasks.length"
                :tasks="mistingTasks"
                :icon="IconMisting"
                label="Zraszanie"
                color="teal-darken-2"
                care-type="misting"
                @done="markDone"
                @snooze="snoozeTask"
              />
              <TaskSection
                v-if="cleaningTasks.length"
                :tasks="cleaningTasks"
                :icon="IconCleaning"
                label="Czyszczenie"
                color="success"
                care-type="cleaning"
                @done="markDone"
                @snooze="snoozeTask"
              />
              <TodayObservationsSection
                v-if="surveyTasks.length"
                :tasks="surveyTasks"
                @open-survey="surveyFormPlant = $event"
              />
            </template>
            <div v-else class="empty-state">
              <IconCheckCircle :size="28" stroke="var(--accent-deep)" />
              Żadna roślina nie wymaga teraz uwagi.
            </div>
          </div>
        </div>

        <!-- Wykonane dziś -->
        <div v-if="todayDone.length" class="sketch-card">
          <button class="card-head card-head--btn" @click="doneExpanded = !doneExpanded">
            <IconCheckCircle :size="18" stroke="#1D7A45" class="icon-shrink" />
            <span class="card-head__label card-head__label--green">Wykonane dziś</span>
            <span class="card-head__pill card-head__pill--green">
              {{ todayDone.length }}
            </span>
            <IconChevronDown
              class="card-head__chevron"
              :class="{ 'card-head__chevron--open': doneExpanded }"
              :size="14"
              stroke="#1D7A45"
            />
          </button>
          <div v-if="doneExpanded" class="card-body card-body--list">
            <RoomGroupedTaskList :groups="todayDoneGroups" :item-key="(item) => item.event.id">
              <template #tag="{ item }">
                <span class="care-tag" :class="`care-tag--${item.event.type}`">
                  {{ CARE_TYPE_LABELS[item.event.type] }}
                </span>
              </template>
            </RoomGroupedTaskList>
          </div>
        </div>

        <!-- Przycisk sezonowy -->
        <RouterLink v-if="seasonalCount > 0" to="/ten-miesiac" class="seasonal-btn">
          <IconRepotting :size="17" />
          Przesadzanie i przycinanie
          <span class="seasonal-btn__pill">{{ seasonalCount }}</span>
          <IconChevronRight :size="14" class="seasonal-btn__arrow" />
        </RouterLink>

        <!-- SurveyForm dialog -->
        <SurveyForm
          v-if="surveyFormPlant"
          :model-value="!!surveyFormPlant"
          :plant="surveyFormPlant"
          @update:model-value="
            (v: boolean) => {
              if (!v) surveyFormPlant = null
            }
          "
          @save="handleSaveSurvey"
        />
      </template>

      <!-- Welcome screen — no plants yet -->
      <TodayWelcomeScreen v-if="!plantsStore.plants.length" />
    </template>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 8px;
}

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

.icon-btn {
  width: 38px;
  height: 38px;
  border: 1.5px solid var(--line);
  background: var(--paper);
  border-radius: 10px 12px 11px 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-2);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s;
}
.icon-btn:hover {
  background: var(--paper-2);
}

.sketch-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: 28px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  background: var(--paper);
  border-bottom: 1.5px dashed var(--ink-3);
}

.card-head--btn {
  width: 100%;
  cursor: pointer;
  border: none;
  border-bottom: 1.5px dashed var(--ink-3);
  outline: none;
  transition: background 0.1s;
}
.card-head--btn:hover {
  background: color-mix(in oklab, var(--paper) 80%, var(--line));
}

.icon-shrink {
  flex-shrink: 0;
}

.card-head__chevron {
  margin-left: auto;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.card-head__chevron--open {
  transform: rotate(180deg);
}

.card-head__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 500;
  flex: 1;
}
.card-head__label--green {
  color: #1d7a45;
}
.card-head__label--warn {
  color: var(--warn);
}
.card-head__label--blue {
  color: var(--blue);
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
  font-size: 11px;
}
.card-head__pill--green {
  border-color: #1d7a45;
  background: rgba(29, 122, 69, 0.1);
  color: #1d7a45;
}
.card-head__pill--warn {
  border-color: var(--warn);
  background: var(--warn-soft);
  color: var(--warn);
}
.card-head__pill--blue {
  border-color: var(--blue);
  background: var(--blue-soft);
  color: var(--blue);
}

.card-body {
  padding: 10px 14px;
  background: var(--paper-card);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-2);
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  padding: 4px 0;
}

.day-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.card-body--list {
  padding: 0;
}

.day-row__room {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  margin-top: 2px;
}

.care-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 7px 9px 8px 10px;
  border: 1.2px solid var(--line);
  color: var(--ink-3);
  background: var(--paper);
  white-space: nowrap;
  flex-shrink: 0;
}
.care-tag--watering {
  color: var(--blue);
  border-color: var(--blue);
  background: var(--blue-soft);
}
.care-tag--fertilizing {
  color: var(--copper);
  border-color: var(--copper);
  background: var(--copper-soft);
}
.care-tag--misting {
  color: var(--mist);
  border-color: var(--mist);
  background: var(--mist-soft);
}
.care-tag--pruning {
  color: var(--warn);
  border-color: var(--warn);
  background: var(--warn-soft);
}
.care-tag--repotting {
  color: #8b5e3c;
  border-color: #8b5e3c;
  background: #f5ede6;
}

.day-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-3);
}

/* ── Seasonal button ── */
.seasonal-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  margin-bottom: 28px;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink-2);
  text-decoration: none;
  transition:
    background 0.12s,
    color 0.12s;
}
.seasonal-btn:hover {
  background: var(--paper);
  color: var(--ink);
}
.seasonal-btn__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border: 1.3px solid var(--warn);
  border-radius: 10px 12px 11px 13px;
  background: var(--warn-soft);
  color: var(--warn);
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 13px;
}
.seasonal-btn__arrow {
  margin-left: auto;
  opacity: 0.5;
}

@media (max-width: 400px) {
  .date-title {
    font-size: 36px;
  }
  .card-body:not(.card-body--list) {
    padding: 12px;
  }
}
</style>
