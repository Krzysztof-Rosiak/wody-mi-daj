<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'
import type { Plant } from '@/types'
import type { PlantTemplate } from '@/data/plantTemplates'
import { useRoomsStore } from '@/stores/rooms'
import PlantTemplateSearch from './PlantTemplateSearch.vue'
import PlantPhotoField from './PlantPhotoField.vue'
import PlantFormFields from './PlantFormFields.vue'
import IconBtn from '@/components/ui/IconBtn.vue'
import SketchBtn from '@/components/ui/SketchBtn.vue'
import IconArrowBack from '@/components/icons/IconArrowBack.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconPlus from '@/components/icons/IconPlus.vue'

const props = defineProps<{
  modelValue: boolean
  plant?: Plant
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Omit<Plant, 'id' | 'createdAt'>]
}>()

const roomsStore = useRoomsStore()
onMounted(() => {
  if (!roomsStore.customRooms.length) roomsStore.fetchAll()
})

type Step = 'search' | 'template-form' | 'custom-form' | 'template-search-edit'

const templateSearchRef = useTemplateRef<InstanceType<typeof PlantTemplateSearch>>('templateSearch')
const fieldsRef = useTemplateRef<InstanceType<typeof PlantFormFields>>('fields')
const step = ref<Step>('search')
const prevFormStep = ref<'template-form' | 'custom-form'>('custom-form')
const name = ref('')
const species = ref('')
const room = ref('')
const notes = ref('')
const imageBase64 = ref<string | undefined>(undefined)
const wateringIntervalDays = ref<number | undefined>(undefined)
const fertilizingIntervalDays = ref<number | undefined>(undefined)
const mistingIntervalDays = ref<number | undefined>(undefined)
const cleaningIntervalDays = ref<number | undefined>(undefined)
const surveyEnabled = ref(true)
const templateSpecies = ref<string | undefined>(undefined)
const nameError = ref('')
const roomError = ref('')

const isEditMode = computed(() => !!props.plant)
const isCustom = computed(() => !templateSpecies.value)
const dialogTitle = computed(() => {
  if (step.value === 'template-search-edit') return 'Zmień gatunek'
  if (isEditMode.value) return 'Edytuj roślinę'
  if (step.value === 'template-form') return 'Dodaj z szablonu'
  if (step.value === 'custom-form') return 'Własna roślina'
  return 'Dodaj roślinę'
})

function syncFromPlant(plant?: Plant) {
  name.value = plant?.name ?? ''
  species.value = plant?.species ?? ''
  room.value = plant?.room ?? ''
  notes.value = plant?.notes ?? ''
  imageBase64.value = plant?.imageBase64
  wateringIntervalDays.value = plant?.wateringIntervalDays
  fertilizingIntervalDays.value = plant?.fertilizingIntervalDays
  mistingIntervalDays.value = plant?.mistingIntervalDays
  cleaningIntervalDays.value = plant?.cleaningIntervalDays
  templateSpecies.value = plant?.templateSpecies
  surveyEnabled.value = plant?.surveyEnabled !== false
  step.value = isEditMode.value
    ? plant?.templateSpecies
      ? 'template-form'
      : 'custom-form'
    : 'search'
}

watch(() => props.plant, syncFromPlant, { immediate: true })
watch(
  () => props.modelValue,
  (val) => {
    if (val && !isEditMode.value) step.value = 'search'
  },
)
watch(step, (val) => {
  if (!isEditMode.value && (val === 'template-form' || val === 'custom-form')) fieldsRef.value?.focusName()
})

function onTemplateSelected(template: PlantTemplate) {
  if (!isEditMode.value) name.value = template.name
  species.value = template.species
  templateSpecies.value = template.species
  if (!notes.value) notes.value = template.careNotes
  step.value = isEditMode.value ? prevFormStep.value : 'template-form'
}

function openTemplateSearch() {
  prevFormStep.value =
    step.value === 'template-form' || step.value === 'custom-form' ? step.value : 'custom-form'
  step.value = 'template-search-edit'
}

function clearTemplate() {
  templateSpecies.value = undefined
}

function validate() {
  nameError.value = name.value.trim() ? '' : 'Nazwa jest wymagana'
  roomError.value = room.value.trim() ? '' : 'Pokój jest wymagany'
  return !nameError.value && !roomError.value
}

function submit() {
  if (!validate()) return
  const customForm = step.value === 'custom-form'
  emit('save', {
    name: name.value.trim(),
    species: species.value.trim() || undefined,
    room: room.value,
    notes: notes.value.trim() || undefined,
    imageBase64: imageBase64.value,
    wateringIntervalDays:
      customForm && wateringIntervalDays.value ? Number(wateringIntervalDays.value) : undefined,
    fertilizingIntervalDays:
      customForm && fertilizingIntervalDays.value
        ? Number(fertilizingIntervalDays.value)
        : undefined,
    mistingIntervalDays:
      customForm && mistingIntervalDays.value ? Number(mistingIntervalDays.value) : undefined,
    cleaningIntervalDays:
      customForm && cleaningIntervalDays.value ? Number(cleaningIntervalDays.value) : undefined,
    templateSpecies: templateSpecies.value,
    surveyEnabled: surveyEnabled.value,
  })
  emit('update:modelValue', false)
  syncFromPlant(props.plant)
}

function close() {
  emit('update:modelValue', false)
  syncFromPlant(props.plant)
}

function goToCustomForm() {
  syncFromPlant()
  step.value = 'custom-form'
}

function goToCustomFormFromEdit() {
  clearTemplate()
  step.value = prevFormStep.value
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="bot-modal">
      <!-- Head -->
      <div class="bot-modal__head">
        <div class="head-left">
          <button
            v-if="step === 'template-search-edit' || (!isEditMode && step !== 'search')"
            class="back-btn"
            @click="step === 'template-search-edit' ? (step = prevFormStep) : (step = 'search')"
          >
            <IconArrowBack :size="14" />
          </button>
          <h2 class="bot-modal__title">{{ dialogTitle }}</h2>
        </div>
        <IconBtn @click="step === 'template-search-edit' ? (step = prevFormStep) : step !== 'search' && !isEditMode ? (step = 'search') : templateSearchRef?.cancelDetail() || close()">
          <IconClose :size="16" />
        </IconBtn>
      </div>

      <!-- Step: Szukaj szablonu (dodawanie) -->
      <div v-if="step === 'search'" class="bot-modal__body">
        <p class="step-hint">
          Znajdź swoją roślinę na liście, aby automatycznie wypełnić dane pielęgnacyjne.
        </p>
        <PlantTemplateSearch ref="templateSearch" @select="onTemplateSelected" />
        <div class="divider-row">
          <span class="divider-label">lub</span>
        </div>
        <button
          class="custom-btn"
          @click="goToCustomForm"
        >
          <IconPlus :size="14" />
          Dodaj własną roślinę
        </button>
      </div>

      <!-- Step: Zmiana szablonu (edycja) -->
      <div v-else-if="step === 'template-search-edit'" class="bot-modal__body">
        <p class="step-hint">
          Wybierz gatunek z listy lub wróć, by zostawić roślinę bez przypisanego szablonu.
        </p>
        <PlantTemplateSearch @select="onTemplateSelected" />
        <div class="divider-row">
          <span class="divider-label">lub</span>
        </div>
        <button
          class="custom-btn"
          @click="goToCustomFormFromEdit"
        >
          <IconClose :size="14" />
          Bez szablonu (własna roślina)
        </button>
      </div>

      <!-- Step: Formularz -->
      <div v-else class="bot-modal__body">
        <PlantPhotoField v-model:image-base64="imageBase64" />

        <PlantFormFields
          ref="fields"
          v-model:name="name"
          v-model:species="species"
          v-model:room="room"
          v-model:notes="notes"
          v-model:watering-interval-days="wateringIntervalDays"
          v-model:fertilizing-interval-days="fertilizingIntervalDays"
          v-model:misting-interval-days="mistingIntervalDays"
          v-model:cleaning-interval-days="cleaningIntervalDays"
          v-model:survey-enabled="surveyEnabled"
          v-model:template-species="templateSpecies"
          v-model:name-error="nameError"
          v-model:room-error="roomError"
          :is-edit-mode="isEditMode"
          :is-custom="isCustom"
          :room-options="roomsStore.allRooms"
          @open-template-search="openTemplateSearch"
          @clear-template="clearTemplate"
        />
      </div>

      <!-- Footer -->
      <div class="bot-modal__foot">
        <SketchBtn
          variant="ghost"
          @click="step === 'template-search-edit' ? (step = prevFormStep) : step !== 'search' && !isEditMode ? (step = 'search') : close()"
        >{{ step === 'template-search-edit' || (step !== 'search' && !isEditMode) ? 'Wróć' : 'Anuluj' }}</SketchBtn>
        <SketchBtn
          v-if="step !== 'search' && step !== 'template-search-edit'"
          variant="primary"
          @click="submit"
        >
          {{ isEditMode ? 'Zapisz' : 'Dodaj roślinę' }}
        </SketchBtn>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.bot-modal {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  max-width: 100%;
  box-sizing: border-box;
}

.bot-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px dashed var(--line);
  flex-shrink: 0;
  gap: 10px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid var(--line);
  border-radius: 7px 9px 8px 10px;
  cursor: pointer;
  color: var(--ink-3);
  flex-shrink: 0;
}
.back-btn:hover {
  background: var(--paper-2);
}

.bot-modal__title {
  font-family: 'Lato', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.bot-modal__body {
  padding: 18px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bot-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px dashed var(--line);
  flex-shrink: 0;
}

/* Search step */
.step-hint {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-3);
  margin-bottom: 16px;
  line-height: 1.4;
}

.divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}
.divider-row::before,
.divider-row::after {
  content: '';
  flex: 1;
  border-top: 1px dashed var(--line);
}
.divider-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

.custom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
  background: var(--paper);
  border: 1.5px dashed var(--line);
  border-radius: var(--r-card);
  cursor: pointer;
  transition: background 0.1s;
}
.custom-btn:hover {
  background: var(--paper-2);
}

@media (max-width: 400px) {
  .bot-modal__head {
    padding: 12px 12px 10px;
  }
  .bot-modal__body {
    padding: 12px;
  }
  .bot-modal__foot {
    padding: 10px 12px 14px;
  }
  .bot-modal__title {
    font-size: 22px;
  }
}
</style>
