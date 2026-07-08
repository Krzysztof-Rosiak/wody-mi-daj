<script setup lang="ts">
import { ref } from 'vue'
import type { PlantSurvey } from '@/types'
import { SURVEY_CONDITION_LABELS, SURVEY_CONDITION_FG, SURVEY_CONDITION_BG } from '@/types'
import { formatDatePl } from '@/utils/date'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'
import IconPlus from '@/components/icons/IconPlus.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconTrash from '@/components/icons/IconTrash.vue'

const props = defineProps<{
  surveys: PlantSurvey[]
  visibleSurveys: PlantSurvey[]
  hasMore: boolean
  allPhotos: { src: string; label: string; isMain: boolean }[]
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  add: []
  edit: [survey: PlantSurvey]
  delete: [id: number]
  'show-more': []
  'open-gallery': [index: number]
}>()

const surveyToDelete = ref<number | null>(null)

function isRecentSurvey(survey: PlantSurvey) {
  return Date.now() - new Date(survey.date).getTime() < 24 * 60 * 60 * 1000
}

function heightDelta(survey: PlantSurvey): number | null {
  if (!survey.heightCm) return null
  const idx = props.surveys.indexOf(survey)
  for (let i = idx + 1; i < props.surveys.length; i++) {
    const prev = props.surveys[i]
    if (prev.heightCm) return survey.heightCm - prev.heightCm
  }
  return null
}

async function confirmDelete() {
  if (surveyToDelete.value === null) return
  emit('delete', surveyToDelete.value)
  surveyToDelete.value = null
}
</script>

<template>
  <div class="sketch-card">
    <div class="card-head card-head--toggle" @click="emit('update:open', !open)">
      <IconClipboard :size="15" />
      <span class="card-head__label">Obserwacje</span>
      <span class="card-head__count">{{ surveys.length }}</span>
      <button class="card-head__add" @click.stop="emit('add')">
        <IconPlus :size="13" />
      </button>
      <IconChevronDown
        class="toggle-chevron"
        :class="{ 'toggle-chevron--closed': !open }"
        :size="14"
      />
    </div>

    <div v-show="open">
      <div v-if="surveys.length" class="survey-grid">
        <div v-for="survey in visibleSurveys" :key="survey.id" class="survey-card">
          <div
            v-if="survey.imageBase64"
            class="survey-card__photo"
            @click="emit('open-gallery', allPhotos.findIndex((p) => p.src === survey.imageBase64))"
          >
            <img
              :src="survey.imageBase64"
              :alt="`Obserwacja ${survey.date}`"
              class="survey-card__img"
            />
          </div>
          <div class="survey-card__body">
            <div class="survey-card__row">
              <span class="survey-card__date">
                {{
                  formatDatePl(new Date(survey.date), {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                }}
              </span>
              <div class="survey-card__actions">
                <button v-if="isRecentSurvey(survey)" class="edit-btn" @click="emit('edit', survey)">
                  <IconEdit :size="12" />
                </button>
                <button class="del-btn" @click="surveyToDelete = survey.id as number">
                  <IconTrash :size="12" />
                </button>
              </div>
            </div>
            <div class="survey-card__tags">
              <span
                class="condition-chip"
                :style="{
                  color: SURVEY_CONDITION_FG[survey.condition],
                  background: SURVEY_CONDITION_BG[survey.condition],
                  borderColor: SURVEY_CONDITION_FG[survey.condition],
                }"
                >{{ survey.condition }} · {{ SURVEY_CONDITION_LABELS[survey.condition] }}</span
              >
              <span v-if="survey.heightCm" class="height-tag">
                {{ survey.heightCm }} cm<template v-if="heightDelta(survey) !== null">
                  ({{ heightDelta(survey)! > 0 ? '+' : '' }}{{ heightDelta(survey) }} cm)</template
                >
              </span>
            </div>
            <div v-if="survey.notes" class="survey-card__notes">{{ survey.notes }}</div>
          </div>
        </div>
      </div>
      <div v-else class="card-empty">Brak obserwacji — dodaj pierwszą</div>
      <button v-if="hasMore" class="show-more-btn" @click="emit('show-more')">
        Pokaż wszystkie
        <span class="show-more-hint">(+ {{ surveys.length - visibleSurveys.length }} ukrytych)</span>
      </button>
    </div>
  </div>

  <ConfirmDialog
    :model-value="surveyToDelete !== null"
    title="Usuń obserwację"
    body="Czy na pewno chcesz usunąć tę obserwację? Operacji nie można cofnąć."
    @update:model-value="surveyToDelete = null"
    @confirm="confirmDelete"
  >
    <template #icon>
      <IconTrash :size="16" stroke="var(--warn)" />
    </template>
  </ConfirmDialog>
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
  flex: 1;
}

.card-head__count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-3);
  border: 1.2px solid var(--ink-3);
  border-radius: 8px;
  padding: 1px 6px;
}

.card-head__add {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid var(--ink-3);
  border-radius: 7px 9px 8px 10px;
  cursor: pointer;
  color: var(--ink-3);
}
.card-head__add:hover { background: var(--paper-2); color: var(--ink-2); }

.card-head--toggle {
  cursor: pointer;
  user-select: none;
}
.card-head--toggle:hover { background: var(--paper-2); }

.toggle-chevron {
  transition: transform 0.2s ease;
  color: var(--ink-3);
  flex-shrink: 0;
}
.toggle-chevron--closed { transform: rotate(-90deg); }

.card-empty {
  padding: 16px 12px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

.survey-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 12px 12px 4px;
}

.survey-card {
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 12px;
  overflow: hidden;
  background: var(--paper);
}

.survey-card__photo {
  aspect-ratio: 4/3;
  overflow: hidden;
  cursor: pointer;
}
.survey-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.15s;
}
.survey-card__photo:hover .survey-card__img { transform: scale(1.03); }

.survey-card__body {
  padding: 10px 12px;
  border-top: 1px dashed var(--line);
}
.survey-card:not(:has(.survey-card__photo)) .survey-card__body {
  border-top: none;
}

.survey-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.survey-card__date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

.survey-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  color: var(--ink-3);
  flex-shrink: 0;
}
.edit-btn:hover { border-color: var(--accent-deep); color: var(--accent-deep); background: var(--accent-soft); }

.del-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  color: var(--ink-3);
}
.del-btn:hover { border-color: var(--warn); color: var(--warn); background: var(--warn-soft); }

.survey-card__tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.condition-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1.2px solid;
}

.height-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--ink-3);
}

.survey-card__notes {
  margin-top: 6px;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.4;
}

.show-more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 12px 12px;
  padding: 6px 14px;
  width: calc(100% - 24px);
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-3);
  background: transparent;
  border: 1.3px dashed color-mix(in oklab, var(--ink-3) 50%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.show-more-btn:hover { color: var(--ink-2); border-color: var(--ink-3); background: var(--paper-2); }
.show-more-hint { font-size: 10px; }

@media (min-width: 600px) {
  .survey-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
