<script setup lang="ts">
import IconClose from '@/components/icons/IconClose.vue'
import { toISODateString } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  pickedDate: Date | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:pickedDate': [value: Date | null]
  confirm: []
}>()

function onDateInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:pickedDate', val ? new Date(val) : null)
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="340" @update:model-value="emit('update:modelValue', $event)">
    <div class="cal-modal">
      <div class="cal-modal__head">
        <div>
          <div class="cal-modal__caption">Nawigacja</div>
          <h2 class="cal-modal__title">Wybierz dzień</h2>
        </div>
        <button class="cal-modal__close" @click="emit('update:modelValue', false)">
          <IconClose :size="15" />
        </button>
      </div>
      <div class="cal-modal__body">
        <label class="cal-field-label">Data</label>
        <div class="cal-date-wrap">
          <input
            :value="props.pickedDate ? toISODateString(props.pickedDate) : ''"
            type="date"
            class="cal-date-input"
            @input="onDateInput"
          />
        </div>
      </div>
      <div class="cal-modal__foot">
        <button class="cal-btn cal-btn--ghost" @click="emit('update:modelValue', false)">Anuluj</button>
        <button
          class="cal-btn cal-btn--primary"
          :disabled="!props.pickedDate"
          @click="emit('confirm')"
        >
          Przejdź
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.cal-modal {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.cal-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px dashed var(--line);
  gap: 10px;
}

.cal-modal__caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  margin-bottom: 2px;
}

.cal-modal__title {
  font-family: 'Lato', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.cal-modal__close {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid var(--line);
  border-radius: 8px 10px 9px 11px;
  cursor: pointer;
  color: var(--ink-3);
  flex-shrink: 0;
}
.cal-modal__close:hover { background: var(--paper-2); }

.cal-modal__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.cal-field-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

.cal-date-wrap {
  overflow: hidden;
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  background: var(--paper);
  transition: border-color 0.15s;
}
.cal-date-wrap:focus-within { border-color: var(--accent-deep); }

.cal-date-input {
  display: block;
  width: 100%;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  color: var(--ink);
  background: transparent;
  border: none;
  padding: 10px 14px;
  outline: none;
  box-sizing: border-box;
  min-width: 0;
}

.cal-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 14px 12px;
  border-top: 1px dashed var(--line);
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  border-radius: 10px 13px 11px 14px;
  border: 1.5px solid var(--line);
  cursor: pointer;
  transition: transform 0.1s;
}
.cal-btn:hover:not(:disabled) { transform: translateY(-1px); }
.cal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.cal-btn--ghost { background: var(--paper); color: var(--ink-2); }
.cal-btn--primary {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  color: var(--paper);
  box-shadow: 2px 2px 0 color-mix(in oklab, var(--accent-deep) 40%, black);
}
</style>
