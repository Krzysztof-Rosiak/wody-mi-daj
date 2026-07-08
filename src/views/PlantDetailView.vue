<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'
import { useSurveysStore } from '@/stores/surveys'
import { usePhotosStore } from '@/stores/photos'
import { useRepottingDismissalsStore } from '@/stores/repottingDismissals'
import { useSnoozesStore } from '@/stores/snoozes'
import { usePlantPhotoGallery } from '@/composables/usePlantPhotoGallery'
import PlantForm from '@/components/plants/PlantForm.vue'
import CareEventForm from '@/components/care/CareEventForm.vue'
import CareEventList from '@/components/care/CareEventList.vue'
import SurveyForm from '@/components/plants/SurveyForm.vue'
import PhotoGallery from '@/components/plants/PhotoGallery.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PlantCareToast from '@/components/plant/PlantCareToast.vue'
import PlantQuickActions from '@/components/plant/PlantQuickActions.vue'
import PlantObservationsCard from '@/components/plant/PlantObservationsCard.vue'
import PlantDetailHeader from '@/components/plant/PlantDetailHeader.vue'
import PlantRepotInfoCard from '@/components/plant/PlantRepotInfoCard.vue'
import PlantCareSchedule from '@/components/plant/PlantCareSchedule.vue'
import { CARE_TYPE_LABELS } from '@/types'
import type { Plant, PlantSurvey, NewCareEvent, CareType, Snooze } from '@/types'
import {
  getTemplateForPlant,
  getCleaningInterval,
  getCategoryForPlant,
} from '@/composables/usePlantSchedule'
import { useCareActions } from '@/composables/useCareActions'
import { useAddSurvey } from '@/composables/useAddSurvey'
import { useRoomsStore } from '@/stores/rooms'
import IconArchive from '@/components/icons/IconArchive.vue'
import IconClock from '@/components/icons/IconClock.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'

const route = useRoute()
const router = useRouter()
const plantsStore = usePlantsStore()
const careEventsStore = useCareEventsStore()
const surveysStore = useSurveysStore()
const photosStore = usePhotosStore()
const repottingDismissalsStore = useRepottingDismissalsStore()
const snoozesStore = useSnoozesStore()
const { addCareEvent: addCareEventWithCombine } = useCareActions()
const { addSurvey: addSurveyToDb } = useAddSurvey()
const roomsStore = useRoomsStore()

const roomInvalid = computed(() => {
  if (!plant.value) return false
  const room = plant.value.room.toLowerCase()
  return !roomsStore.allRooms.some((r) => r.toLowerCase() === room)
})

const plantId = computed(() => Number(route.params.id))
const plant = computed(() => plantsStore.getById(plantId.value))

const showEditForm = ref(false)
const showCareForm = ref(false)
const showArchiveConfirm = ref(false)
const showSurveyForm = ref(false)
const surveyToEdit = ref<PlantSurvey | undefined>(undefined)

const {
  showGallery,
  galleryStartIndex,
  allPhotos,
  openGallery,
  openGalleryAtMain,
  setAsMainPhoto,
  deletePhoto,
  addPhotoToGallery,
} = usePlantPhotoGallery(plantId, plant)

const sectionOpen = ref({ surveys: true, history: true })
const surveysShowAll = ref(false)
const SURVEYS_PAGE_SIZE = 20

const repotDismissedUntilYear = ref<number | null>(null)
const plantSnoozes = ref<Snooze[]>([])

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarType = ref<CareType>('watering')
let snackbarTimer: ReturnType<typeof setTimeout> | undefined

const visibleSurveys = computed(() => {
  const all = surveysStore.surveys
  if (surveysShowAll.value || all.length <= SURVEYS_PAGE_SIZE) return all
  return all.slice(0, SURVEYS_PAGE_SIZE)
})

const surveysHasMore = computed(
  () => !surveysShowAll.value && surveysStore.surveys.length > SURVEYS_PAGE_SIZE,
)

const plantAge = computed(() => {
  if (!plant.value?.createdAt) return null
  const days = Math.floor((Date.now() - new Date(plant.value.createdAt).getTime()) / 86_400_000)
  if (days < 7) return days === 1 ? '1 dzień' : `${days} dni`
  const weeks = Math.floor(days / 7)
  if (weeks < 8) return weeks === 1 ? '1 tydzień' : `${weeks} tygodnie`
  const totalMonths = Math.floor(days / 30.44)
  if (totalMonths < 24) return totalMonths === 1 ? '1 miesiąc' : `${totalMonths} miesięcy`
  const years = Math.floor(totalMonths / 12)
  const remMonths = totalMonths % 12
  const yearStr = years === 1 ? '1 rok' : `${years} lata`
  if (remMonths === 0) return yearStr
  return `${yearStr} ${remMonths === 1 ? '1 miesiąc' : `${remMonths} mies.`}`
})

const showMistButton = computed(() => {
  if (!plant.value) return false
  const template = getTemplateForPlant(plant.value)
  if (!template) return plant.value.mistingIntervalDays != null
  return template.mistingByMonth[new Date().getMonth()] > 0
})

const showCleanButton = computed(() => !!plant.value && getCleaningInterval(plant.value) != null)

const eventMeta = computed(() => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const year = todayStart.getFullYear()
  const doneToday = new Set<CareType>()
  let repottedThisYear = false
  for (const e of careEventsStore.events) {
    const d = new Date(e.date)
    if (d >= todayStart) doneToday.add(e.type)
    if (e.type === 'repotting' && d.getFullYear() === year) repottedThisYear = true
  }
  return { doneToday, repottedThisYear }
})

const doneTodayTypes = computed(() => eventMeta.value.doneToday)

const showRepotButton = computed(() => {
  if (!plant.value || eventMeta.value.repottedThisYear) return false
  const template = getTemplateForPlant(plant.value)
  if (!template) return false
  return template.repottingMonths.includes(new Date().getMonth() + 1)
})

const repotCategory = computed(() => (plant.value ? getCategoryForPlant(plant.value) : undefined))

const QUICK_CARE_INFO: Partial<Record<CareType, { label: string }>> = {
  watering: { label: 'Podlano' },
  misting: { label: 'Zroszono' },
  fertilizing: { label: 'Nawożono' },
  cleaning: { label: 'Wyczyszczono' },
  repotting: { label: 'Przesadzono' },
}

onMounted(async () => {
  if (!plantsStore.plants.length) await plantsStore.fetchAll()
  if (!roomsStore.customRooms.length) await roomsStore.fetchAll()
  await careEventsStore.fetchByPlant(plantId.value)
  await surveysStore.fetchByPlant(plantId.value)
  await photosStore.fetchByPlant(plantId.value)

  const [dismissals, allSnoozes] = await Promise.all([
    repottingDismissalsStore.getAll(),
    snoozesStore.getAll(),
  ])
  const myDismissal = dismissals.find((d) => d.plantId === plantId.value)
  if (myDismissal) repotDismissedUntilYear.value = myDismissal.dismissedUntilYear
  plantSnoozes.value = allSnoozes.filter((s) => s.plantId === plantId.value)
})

function showSnackbar(type: CareType, text: string) {
  clearTimeout(snackbarTimer)
  snackbarType.value = type
  snackbarText.value = text
  snackbar.value = true
  snackbarTimer = setTimeout(() => {
    snackbar.value = false
  }, 1800)
}

function openEditSurvey(survey: PlantSurvey) {
  surveyToEdit.value = survey
  showSurveyForm.value = true
}

function openAddSurvey() {
  surveyToEdit.value = undefined
  showSurveyForm.value = true
}

async function addSurvey(survey: Omit<PlantSurvey, 'id'>) {
  await addSurveyToDb(survey)
  await surveysStore.fetchByPlant(plantId.value)
  if (survey.imageBase64) {
    await setAsMainPhoto(survey.imageBase64)
  }
}

async function updateSurvey(id: number, data: Partial<Omit<PlantSurvey, 'id' | 'plantId'>>) {
  await surveysStore.update(id, data)
}

async function removeSurvey(id: number) {
  await surveysStore.remove(id)
}

async function saveEdit(data: Omit<Plant, 'id' | 'createdAt'>) {
  await plantsStore.update(plantId.value, data)
}

async function archivePlant() {
  await plantsStore.archive(plantId.value)
  router.push('/rosliny')
}

async function addCareEvent(data: NewCareEvent) {
  await addCareEventWithCombine(data.plantId, data.type, data.date)
  showSnackbar(data.type, CARE_TYPE_LABELS[data.type])
}

async function quickCare(type: CareType) {
  await addCareEventWithCombine(plantId.value, type)
  showSnackbar(type, QUICK_CARE_INFO[type]?.label ?? CARE_TYPE_LABELS[type])
}

async function removeCareEvent(id: number) {
  await careEventsStore.remove(id)
}
</script>

<template>
  <div v-if="plant" class="detail-page">
    <PlantDetailHeader
      :plant="plant"
      :plant-age="plantAge"
      :all-photos="allPhotos"
      @back="router.back()"
      @edit="showEditForm = true"
      @archive="showArchiveConfirm = true"
      @open-photo="openGalleryAtMain"
    />

    <div v-if="roomInvalid" class="room-warning" @click="showEditForm = true">
      <span class="room-warning__text">Pokój „{{ plant.room }}" nie istnieje w liście pokojów — popraw w edycji.</span>
      <span class="room-warning__cta">Edytuj</span>
    </div>

    <PlantQuickActions
      :show-mist-button="showMistButton"
      :show-clean-button="showCleanButton"
      :show-repot-button="showRepotButton"
      :survey-enabled="plant.surveyEnabled !== false"
      :done-today="doneTodayTypes"
      @water="quickCare('watering')"
      @mist="quickCare('misting')"
      @fertilize="quickCare('fertilizing')"
      @clean="quickCare('cleaning')"
      @repot="quickCare('repotting')"
      @care="showCareForm = true"
      @survey="openAddSurvey"
    />

    <PlantRepotInfoCard v-if="showRepotButton && repotCategory" :category="repotCategory" />

    <PlantCareSchedule :plant="plant" :events="careEventsStore.events" :snoozes="plantSnoozes" />

    <PlantObservationsCard
      v-if="plant.surveyEnabled !== false"
      :surveys="surveysStore.surveys"
      :visible-surveys="visibleSurveys"
      :has-more="surveysHasMore"
      :all-photos="allPhotos"
      :open="sectionOpen.surveys"
      @update:open="sectionOpen.surveys = $event"
      @add="openAddSurvey"
      @edit="openEditSurvey"
      @delete="removeSurvey"
      @show-more="surveysShowAll = true"
      @open-gallery="openGallery"
    />

    <div class="sketch-card">
      <div class="card-head card-head--toggle" @click="sectionOpen.history = !sectionOpen.history">
        <IconClock :size="15" />
        <span class="card-head__label">Historia pielęgnacji</span>
        <IconChevronDown
          class="toggle-chevron"
          :class="{ 'toggle-chevron--closed': !sectionOpen.history }"
          :size="14"
        />
      </div>
      <div v-show="sectionOpen.history" class="card-body">
        <CareEventList :events="careEventsStore.events" @remove="removeCareEvent" />
      </div>
    </div>

    <PlantCareToast :visible="snackbar" :type="snackbarType" :text="snackbarText" />

    <PhotoGallery
      v-model="showGallery"
      :photos="allPhotos"
      :start-index="galleryStartIndex"
      @set-main="setAsMainPhoto"
      @delete-photo="deletePhoto"
      @add-photo="addPhotoToGallery"
    />

    <PlantForm v-model="showEditForm" :plant="plant" @save="saveEdit" />
    <CareEventForm v-model="showCareForm" :plant-id="plantId" @save="addCareEvent" />
    <SurveyForm
      v-model="showSurveyForm"
      :plant="plant"
      :survey="surveyToEdit"
      @save="addSurvey"
      @update="updateSurvey"
    />

    <ConfirmDialog
      v-model="showArchiveConfirm"
      title="Archiwizuj roślinę"
      confirm-label="Archiwizuj"
      :max-width="400"
      @confirm="archivePlant"
    >
      <template #icon>
        <IconArchive :size="16" stroke="var(--warn)" />
      </template>
      Czy chcesz zarchiwizować <strong>{{ plant.name }}</strong
      >? Roślina zostanie ukryta z głównej listy.
    </ConfirmDialog>
  </div>

  <div v-else class="not-found">
    <IconPlantBrand :size="56" class="not-found__icon" />
    <div class="not-found__title">Roślina nie znaleziona</div>
    <RouterLink to="/rosliny" class="add-btn">Wróć do listy</RouterLink>
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: color-mix(in oklab, var(--warn) 10%, var(--paper-card));
  border: 1.5px solid color-mix(in oklab, var(--warn) 40%, transparent);
  border-radius: var(--r-card);
  cursor: pointer;
}

.room-warning__text {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--warn);
  line-height: 1.3;
}

.room-warning__cta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--warn);
  border: 1.3px solid color-mix(in oklab, var(--warn) 50%, transparent);
  border-radius: 6px 8px 7px 9px;
  padding: 3px 8px;
  white-space: nowrap;
  flex-shrink: 0;
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

.card-head__label {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
  flex: 1;
}

.card-head--toggle {
  cursor: pointer;
  user-select: none;
}
.card-head--toggle:hover {
  background: var(--paper-2);
}

.toggle-chevron {
  transition: transform 0.2s ease;
  color: var(--ink-3);
  flex-shrink: 0;
}
.toggle-chevron--closed {
  transform: rotate(-90deg);
}

.card-body {
  padding: 10px 12px;
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  text-align: center;
}
.not-found__icon {
  color: var(--accent-deep);
  opacity: 0.3;
}
.not-found__title {
  font-family: 'Lato', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--ink-2);
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  box-shadow:
    2px 2px 0 var(--paper-2),
    2px 2px 0 1.5px var(--line);
  cursor: pointer;
  text-decoration: none;
}
</style>
