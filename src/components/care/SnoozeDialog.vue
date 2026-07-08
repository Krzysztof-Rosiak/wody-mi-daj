<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { toISODateString } from '@/utils/date'
import SketchBtn from '@/components/ui/SketchBtn.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconSnooze from '@/components/icons/IconSnooze.vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'
import IconChevronRight from '@/components/icons/IconChevronRight.vue'
import IconArrowBack from '@/components/icons/IconArrowBack.vue'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  snooze: [until: Date]
}>()

const settingsStore = useSettingsStore()
const showDatePicker = ref(false)
const pickedDate = ref('')

const minDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toISODateString(d)
})()

function close() {
  emit('update:modelValue', false)
  showDatePicker.value = false
  pickedDate.value = ''
}

function snoozeByDays(days: number) {
  const until = new Date()
  until.setHours(0, 0, 0, 0)
  until.setDate(until.getDate() + days)
  emit('snooze', until)
  close()
}

function snoozeByDate() {
  if (!pickedDate.value) return
  const until = new Date(pickedDate.value)
  until.setHours(0, 0, 0, 0)
  emit('snooze', until)
  close()
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="380" @update:model-value="close">
    <div class="snooze-modal">
      <div class="snooze-head">
        <div>
          <div class="snooze-caption">Pielęgnacja</div>
          <h2 class="snooze-title">Odłóż na później</h2>
        </div>
        <button class="snooze-close" @click="close">
          <IconClose :size="15" />
        </button>
      </div>

      <div v-if="!showDatePicker" class="snooze-opts">
        <button class="snooze-opt" @click="snoozeByDays(settingsStore.snoozeDays)">
          <span class="snooze-opt__ico">
            <IconSnooze :size="15" />
          </span>
          <span class="snooze-opt__label">Za {{ settingsStore.snoozeDays }} {{ settingsStore.snoozeDays === 1 ? 'dzień' : 'dni' }}</span>
          <IconChevronRight :size="13" />
        </button>
        <button class="snooze-opt" @click="snoozeByDays(7)">
          <span class="snooze-opt__ico">
            <IconCalendar :size="15" />
          </span>
          <span class="snooze-opt__label">Za tydzień</span>
          <IconChevronRight :size="13" />
        </button>
        <button class="snooze-opt" @click="showDatePicker = true">
          <span class="snooze-opt__ico">
            <IconCalendar :size="15" />
          </span>
          <span class="snooze-opt__label">Wybierz datę…</span>
          <IconChevronRight :size="13" />
        </button>
      </div>

      <div v-else class="snooze-picker">
        <label class="picker-label">Wybierz datę</label>
        <input v-model="pickedDate" type="date" :min="minDate" class="picker-input" />
        <div class="picker-foot">
          <SketchBtn variant="ghost" @click="showDatePicker = false">
            <IconArrowBack :size="13" />
            Wróć
          </SketchBtn>
          <SketchBtn variant="primary" :disabled="!pickedDate" @click="snoozeByDate">Zatwierdź</SketchBtn>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.snooze-modal {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.snooze-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px dashed var(--line);
  gap: 10px;
}

.snooze-caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--ink-3);
  margin-bottom: 2px;
}

.snooze-title {
  font-family: 'Lato', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.snooze-close {
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
.snooze-close:hover { background: var(--paper-2); }

.snooze-opts {
  display: flex;
  flex-direction: column;
  padding: 10px 14px 16px;
  gap: 6px;
}

.snooze-opt {
  display: grid;
  grid-template-columns: 32px 1fr 20px;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  cursor: pointer;
  text-align: left;
  color: var(--ink-2);
  transition: background 0.1s, border-color 0.1s, transform 0.1s;
}
.snooze-opt:hover {
  background: var(--accent-soft);
  border-color: var(--accent-deep);
  color: var(--accent-deep);
  transform: translateX(2px);
}

.snooze-opt__ico {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--paper-2);
  border: 1.3px solid var(--line);
  border-radius: 8px 10px 9px 11px;
  color: inherit;
  flex-shrink: 0;
}
.snooze-opt:hover .snooze-opt__ico {
  background: var(--accent-soft);
  border-color: var(--accent-deep);
}

.snooze-opt__label {
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: inherit;
}

.snooze-picker {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.picker-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--ink-3);
}

.picker-input {
  width: 100%;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.picker-input:focus { border-color: var(--accent-deep); }

.picker-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

</style>
