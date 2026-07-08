<script setup lang="ts">
import { nextTick, useTemplateRef } from 'vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconSearch from '@/components/icons/IconSearch.vue'

defineProps<{
  isEditMode: boolean
  isCustom: boolean
  roomOptions: string[]
}>()

const emit = defineEmits<{
  'open-template-search': []
  'clear-template': []
}>()

const name = defineModel<string>('name', { required: true })
const species = defineModel<string>('species', { required: true })
const room = defineModel<string>('room', { required: true })
const notes = defineModel<string>('notes', { required: true })
const wateringIntervalDays = defineModel<number | undefined>('wateringIntervalDays')
const fertilizingIntervalDays = defineModel<number | undefined>('fertilizingIntervalDays')
const mistingIntervalDays = defineModel<number | undefined>('mistingIntervalDays')
const cleaningIntervalDays = defineModel<number | undefined>('cleaningIntervalDays')
const surveyEnabled = defineModel<boolean>('surveyEnabled', { required: true })
const templateSpecies = defineModel<string | undefined>('templateSpecies')
const nameError = defineModel<string>('nameError', { required: true })
const roomError = defineModel<string>('roomError', { required: true })

const nameInput = useTemplateRef<HTMLInputElement>('nameInput')

function focusName() {
  nextTick(() => nameInput.value?.focus())
}

defineExpose({ focusName })
</script>

<template>
  <div class="fields">
    <div class="field-group">
      <label class="field-label">Nazwa *</label>
      <input
        ref="nameInput"
        v-model="name"
        type="text"
        class="bot-input"
        placeholder="np. Monstera"
        @input="nameError = ''"
      />
      <div v-if="nameError" class="field-error">{{ nameError }}</div>
    </div>

    <!-- Gatunek: w trybie edycji zawsze widoczne, w trybie dodawania tylko dla custom -->
    <div v-if="isEditMode || isCustom" class="field-group">
      <label class="field-label">Gatunek <span class="opt">(opcjonalne)</span></label>
      <div v-if="templateSpecies" class="template-tag">
        <span class="template-tag__name">{{ species || templateSpecies }}</span>
        <button class="template-tag__clear" title="Odłącz szablon" @click="emit('clear-template')">
          <IconClose :size="11" />
        </button>
      </div>
      <input
        v-else
        v-model="species"
        type="text"
        class="bot-input"
        placeholder="np. Monstera deliciosa"
      />
      <button class="template-pick-btn" @click="emit('open-template-search')">
        <IconSearch :size="13" />
        {{ templateSpecies ? 'Zmień gatunek z listy' : 'Wybierz z listy gatunków' }}
      </button>
    </div>

    <div class="field-group">
      <label class="field-label">Pokój *</label>
      <select v-model="room" class="bot-select" @change="roomError = ''">
        <option value="" disabled>Wybierz pokój…</option>
        <option v-for="r in roomOptions" :key="r" :value="r">{{ r }}</option>
      </select>
      <div v-if="roomError" class="field-error">{{ roomError }}</div>
    </div>

    <template v-if="isCustom">
      <div class="field-group">
        <label class="field-label">Interwały pielęgnacji (dni)</label>
        <div class="interval-row">
          <div class="interval-item">
            <span class="interval-label">Podlewanie</span>
            <input
              v-model.number="wateringIntervalDays"
              type="number"
              min="1"
              max="365"
              class="bot-input bot-input--sm"
              placeholder="7"
            />
          </div>
          <div class="interval-item">
            <span class="interval-label">Nawożenie</span>
            <input
              v-model.number="fertilizingIntervalDays"
              type="number"
              min="1"
              max="365"
              class="bot-input bot-input--sm"
              placeholder="14"
            />
          </div>
          <div class="interval-item">
            <span class="interval-label">Zraszanie</span>
            <input
              v-model.number="mistingIntervalDays"
              type="number"
              min="1"
              max="365"
              class="bot-input bot-input--sm"
              placeholder="3"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-if="isCustom" class="field-group">
      <label class="field-label">Czyszczenie liści <span class="opt">(dni, opcjonalne)</span></label>
      <input
        v-model.number="cleaningIntervalDays"
        type="number"
        min="1"
        max="365"
        class="bot-input"
        placeholder="np. 30"
      />
    </div>

    <div class="field-group">
      <label class="field-label">Notatki <span class="opt">(opcjonalne)</span></label>
      <textarea
        v-model="notes"
        class="bot-textarea"
        rows="3"
        placeholder="Wskazówki pielęgnacyjne…"
      />
    </div>

    <label class="survey-toggle">
      <input v-model="surveyEnabled" type="checkbox" class="survey-toggle__check" />
      <span class="survey-toggle__box"></span>
      <div>
        <div class="survey-toggle__label">Ankieta miesięczna</div>
        <div class="survey-toggle__hint">Przypomnienie o wypełnieniu ankiety stanu co miesiąc</div>
      </div>
    </label>
  </div>
</template>

<style scoped>
.fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin-bottom: 6px;
}
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

.bot-input,
.bot-select,
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
  appearance: none;
}
.bot-input:focus,
.bot-select:focus,
.bot-textarea:focus {
  border-color: var(--accent-deep);
}
.bot-textarea {
  resize: vertical;
  min-height: 72px;
}
.bot-input--sm {
  font-size: 16px;
  padding: 7px 10px;
}

/* Intervals */
.interval-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.interval-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.interval-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

/* Template tag */
.template-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 12px;
  background: var(--accent-soft);
  border: 1.3px solid var(--accent-deep);
  border-radius: 8px 11px 9px 12px;
  margin-bottom: 6px;
  align-self: flex-start;
}
.template-tag__name {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--accent-deep);
  font-style: italic;
}
.template-tag__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--accent-deep);
  opacity: 0.7;
  border-radius: 4px;
  padding: 0;
}
.template-tag__clear:hover {
  opacity: 1;
  background: color-mix(in oklab, var(--accent-deep) 15%, transparent);
}

.template-pick-btn {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  background: transparent;
  border: 1.3px dashed var(--ink-3);
  border-radius: 8px 10px 9px 11px;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s,
    border-color 0.1s;
  align-self: flex-start;
}
.template-pick-btn:hover {
  background: var(--paper-2);
  color: var(--ink-2);
  border-color: var(--ink-2);
  border-style: solid;
}

/* Survey toggle */
.survey-toggle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  padding: 10px 12px;
  border: 1.3px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  background: var(--paper);
}
.survey-toggle__check {
  display: none;
}
.survey-toggle__box {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--line);
  border-radius: 5px;
  background: var(--paper);
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.1s,
    border-color 0.1s;
}
.survey-toggle__check:checked + .survey-toggle__box {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
}
.survey-toggle__check:checked + .survey-toggle__box::after {
  content: '';
  width: 10px;
  height: 6px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translate(1px, -1px);
  display: block;
}
.survey-toggle__label {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink);
}
.survey-toggle__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--ink-3);
  margin-top: 2px;
  line-height: 1.4;
}

@media (max-width: 360px) {
  .interval-row {
    grid-template-columns: 1fr;
  }
}
</style>
