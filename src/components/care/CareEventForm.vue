<script setup lang="ts">
import { ref } from 'vue'
import { CARE_TYPE_LABELS, type CareType, type CareEvent } from '@/types'
import IconBtn from '@/components/ui/IconBtn.vue'
import SketchBtn from '@/components/ui/SketchBtn.vue'
import IconClose from '@/components/icons/IconClose.vue'
import { toISODateString } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  plantId: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Omit<CareEvent, 'id'>]
}>()

const CARE_TYPES = (Object.keys(CARE_TYPE_LABELS) as CareType[]).map((key) => ({
  label: CARE_TYPE_LABELS[key],
  value: key,
}))

const type = ref<CareType>('watering')
const date = ref(toISODateString())
const notes = ref('')

function submit() {
  if (!type.value || !date.value) return
  emit('save', {
    plantId: props.plantId,
    type: type.value,
    date: new Date(date.value),
    notes: notes.value.trim() || undefined,
  })
  emit('update:modelValue', false)
  resetForm()
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function resetForm() {
  type.value = 'watering'
  date.value = toISODateString()
  notes.value = ''
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="400"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="bot-modal">
      <div class="bot-modal__head">
        <h2 class="bot-modal__title">Dodaj pielęgnację</h2>
        <IconBtn @click="close">
          <IconClose :size="16" />
        </IconBtn>
      </div>

      <div class="bot-modal__body">
        <label class="field-label">Typ pielęgnacji</label>
        <div class="type-grid">
          <button
            v-for="ct in CARE_TYPES"
            :key="ct.value"
            class="type-chip"
            :class="{ 'type-chip--active': type === ct.value }"
            @click="type = ct.value"
          >
            {{ ct.label }}
          </button>
        </div>

        <label class="field-label field-label--mt">Data</label>
        <input v-model="date" type="date" class="bot-input" />

        <label class="field-label field-label--mt"
          >Notatki <span class="opt">(opcjonalne)</span></label
        >
        <textarea
          v-model="notes"
          class="bot-textarea"
          rows="2"
          placeholder="np. podlano obficie…"
        />
      </div>

      <div class="bot-modal__foot">
        <SketchBtn variant="ghost" @click="close">Anuluj</SketchBtn>
        <SketchBtn variant="primary" :disabled="!type || !date" @click="submit">Zapisz</SketchBtn>
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
}

.bot-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px dashed var(--line);
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
  display: flex;
  flex-direction: column;
}

.bot-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px dashed var(--line);
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
.field-label--mt { margin-top: 16px; }
.opt {
  opacity: 0.6;
  text-transform: none;
  font-size: 9px;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-chip {
  padding: 5px 12px;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-2);
  background: var(--paper);
  border: 1.3px solid var(--line);
  border-radius: 8px 11px 9px 12px;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s,
    border-color 0.1s;
}
.type-chip:hover {
  background: var(--paper-2);
}
.type-chip--active {
  background: var(--accent-soft);
  border-color: var(--accent-deep);
  color: var(--accent-deep);
  font-weight: 700;
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

</style>
