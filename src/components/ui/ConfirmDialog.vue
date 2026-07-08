<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  maxWidth?: number
}>(), {
  confirmLabel: 'Usuń',
  cancelLabel: 'Anuluj',
  maxWidth: 360,
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: []
}>()
</script>

<template>
  <v-dialog :model-value="modelValue" :max-width="maxWidth" @update:model-value="emit('update:modelValue', $event as boolean)">
    <div class="cd">
      <div class="cd__head">
        <slot name="icon" />
        <span class="cd__title">{{ title }}</span>
      </div>
      <div class="cd__body">
        <slot>{{ body }}</slot>
      </div>
      <div class="cd__footer">
        <button class="cd-btn cd-btn--ghost" @click="emit('update:modelValue', false)">{{ cancelLabel }}</button>
        <button class="cd-btn cd-btn--warn" @click="emit('confirm')">{{ confirmLabel }}</button>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.cd {
  background: var(--paper);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.cd__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1.5px dashed var(--ink-3);
  background: var(--paper);
}

.cd__title {
  font-family: 'Lato', sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: var(--ink);
}

.cd__body {
  padding: 16px 18px;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink-2);
  line-height: 1.5;
  background: var(--paper-card);
}

.cd__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1.5px dashed var(--ink-3);
  background: var(--paper);
}

.cd-btn {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  border-radius: 10px 13px 11px 12px / 12px 11px 13px 10px;
  border: 1.5px solid var(--line);
  cursor: pointer;
  transition: transform 0.1s;
}
.cd-btn:hover { transform: translateY(-1px); }

.cd-btn--ghost {
  background: var(--paper);
  color: var(--ink-2);
}

.cd-btn--warn {
  background: var(--warn-soft);
  border-color: var(--warn);
  color: var(--warn);
  font-weight: 700;
}
</style>
