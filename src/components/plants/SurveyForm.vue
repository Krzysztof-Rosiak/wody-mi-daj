<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSurveysStore } from '@/stores/surveys'
import { SURVEY_CONDITION_LABELS, SURVEY_CONDITION_FG, SURVEY_CONDITION_BG } from '@/types'
import type { Plant, PlantSurvey } from '@/types'
import SurveyPhotoField from './SurveyPhotoField.vue'
import IconBtn from '@/components/ui/IconBtn.vue'
import SketchBtn from '@/components/ui/SketchBtn.vue'
import IconClose from '@/components/icons/IconClose.vue'

const props = defineProps<{
  modelValue: boolean
  plant: Plant
  survey?: PlantSurvey
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [survey: Omit<PlantSurvey, 'id'>]
  update: [id: number, data: Partial<Omit<PlantSurvey, 'id' | 'plantId'>>]
}>()

const surveysStore = useSurveysStore()
const isEditMode = computed(() => !!props.survey)
const lastSurvey = ref<PlantSurvey | undefined>(undefined)

const condition = ref<1 | 2 | 3 | 4 | 5>(3)
const heightCm = ref<number | null>(null)
const notes = ref('')
const imageBase64 = ref<string | undefined>(undefined)
const compressing = ref(false)

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      if (props.survey) {
        lastSurvey.value = undefined
        condition.value = props.survey.condition
        heightCm.value = props.survey.heightCm ?? null
        notes.value = props.survey.notes ?? ''
        imageBase64.value = props.survey.imageBase64
      } else {
        const prev = await surveysStore.getLastByPlant(props.plant.id as number)
        lastSurvey.value = prev
        condition.value = prev?.condition ?? 3
        heightCm.value = null
        notes.value = ''
        imageBase64.value = undefined
      }
    }
  },
)

const CONDITION_COLORS = SURVEY_CONDITION_FG
const CONDITION_BG = SURVEY_CONDITION_BG

function submit() {
  if (isEditMode.value) {
    emit('update', props.survey!.id as number, {
      condition: condition.value,
      heightCm: heightCm.value && heightCm.value > 0 ? heightCm.value : undefined,
      notes: notes.value.trim() || undefined,
      imageBase64: imageBase64.value,
    })
  } else {
    emit('save', {
      plantId: props.plant.id as number,
      date: new Date(),
      condition: condition.value,
      heightCm: heightCm.value && heightCm.value > 0 ? heightCm.value : undefined,
      notes: notes.value.trim() || undefined,
      imageBase64: imageBase64.value,
    })
  }
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="bot-modal">
      <div class="bot-modal__head">
        <div>
          <div class="head-caption">{{ isEditMode ? 'Edytuj obserwację' : 'Obserwacja' }}</div>
          <h2 class="bot-modal__title">{{ plant.name }}</h2>
        </div>
        <IconBtn @click="emit('update:modelValue', false)">
          <IconClose :size="16" />
        </IconBtn>
      </div>

      <SurveyPhotoField
        v-model:image-base64="imageBase64"
        v-model:compressing="compressing"
        :is-edit-mode="isEditMode"
        :last-survey="lastSurvey"
      />

      <div class="bot-modal__body">
        <!-- Kondycja -->
        <label class="field-label">Kondycja rośliny</label>
        <div class="condition-row">
          <button
            v-for="val in [1, 2, 3, 4, 5] as const"
            :key="val"
            class="cond-btn"
            :class="{ 'cond-btn--active': condition === val }"
            :style="
              condition === val ? `--cc: ${CONDITION_COLORS[val]}; --cb: ${CONDITION_BG[val]}` : ''
            "
            @click="condition = val"
          >
            <span class="cond-btn__num">{{ val }}</span>
            <span class="cond-btn__lbl">{{ SURVEY_CONDITION_LABELS[val] }}</span>
          </button>
        </div>

        <!-- Wysokość -->
        <label class="field-label field-label--mt18"
          >Wysokość od ziemi (cm) <span class="opt">(opcjonalna)</span></label
        >
        <div class="input-with-suffix">
          <input
            v-model.number="heightCm"
            type="number"
            min="1"
            max="500"
            class="bot-input"
            placeholder="np. 35"
          />
          <span class="input-suffix">cm</span>
        </div>
        <!-- Notatki -->
        <label class="field-label field-label--mt"
          >Notatka <span class="opt">(opcjonalna)</span></label
        >
        <textarea
          v-model="notes"
          class="bot-textarea"
          rows="2"
          placeholder="np. nowe listki, żółknięcie…"
        />
      </div>

      <div class="bot-modal__foot">
        <SketchBtn variant="ghost" @click="emit('update:modelValue', false)">Anuluj</SketchBtn>
        <SketchBtn variant="primary" :disabled="compressing" @click="submit">
          <svg v-if="compressing" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          {{ isEditMode ? 'Zapisz zmiany' : 'Zapisz obserwację' }}
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
  max-height: 90vh;
}

.bot-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px dashed var(--line);
  flex-shrink: 0;
}

.head-caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  margin-bottom: 2px;
}

.bot-modal__title {
  font-family: 'Lato', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

/* Body */
.bot-modal__body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.bot-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px dashed var(--line);
  flex-shrink: 0;
}

.field-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin-bottom: 8px;
  display: block;
}
.field-label--mt   { margin-top: 16px; }
.field-label--mt18 { margin-top: 18px; }
.opt {
  opacity: 0.6;
  text-transform: none;
  font-size: 9px;
}
.field-error {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--warn);
  margin-top: 4px;
}

/* Condition */
.condition-row {
  display: flex;
  gap: 6px;
}

.cond-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 12px 11px 13px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  min-width: 0;
}
.cond-btn:hover:not(.cond-btn--active) {
  background: var(--paper-2);
}
.cond-btn--active {
  border-color: var(--cc);
  background: var(--cb);
}

.cond-btn__num {
  font-family: 'Lato', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-2);
  line-height: 1;
}
.cond-btn--active .cond-btn__num {
  color: var(--cc);
}

.cond-btn__lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.cond-btn--active .cond-btn__lbl {
  color: var(--cc);
}

/* Inputs */
.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}
.input-with-suffix .bot-input {
  padding-right: 40px;
}
.input-suffix {
  position: absolute;
  right: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-3);
  pointer-events: none;
}

.bot-input,
.bot-textarea {
  width: 100%;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.bot-input:focus,
.bot-textarea:focus {
  border-color: var(--accent-deep);
}
.bot-textarea {
  resize: vertical;
  min-height: 60px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.spin {
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
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
  .cond-btn__num {
    font-size: 18px;
  }
  .cond-btn {
    padding: 6px 2px;
  }
}
</style>
