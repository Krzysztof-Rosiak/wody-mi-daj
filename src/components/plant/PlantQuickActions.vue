<script setup lang="ts">
import IconWater from '@/components/icons/IconWater.vue'
import IconMisting from '@/components/icons/IconMisting.vue'
import IconFertilizing from '@/components/icons/IconFertilizing.vue'
import IconCleaning from '@/components/icons/IconCleaning.vue'
import IconRepotting from '@/components/icons/IconRepotting.vue'
import IconPlus from '@/components/icons/IconPlus.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'
import type { CareType } from '@/types'

defineProps<{
  showMistButton: boolean
  showCleanButton: boolean
  showRepotButton: boolean
  surveyEnabled: boolean
  doneToday?: Set<CareType>
}>()

const emit = defineEmits<{
  water: []
  mist: []
  fertilize: []
  clean: []
  repot: []
  care: []
  survey: []
}>()
</script>

<template>
  <div class="quick-actions">
    <button
      class="action-btn action-btn--water"
      :class="{ 'action-btn--done': doneToday?.has('watering') }"
      :disabled="doneToday?.has('watering')"
      @click="emit('water')"
    >
      <IconWater :size="14" />
      Podlej
    </button>
    <button
      v-if="showMistButton"
      class="action-btn action-btn--mist"
      :class="{ 'action-btn--done': doneToday?.has('misting') }"
      :disabled="doneToday?.has('misting')"
      @click="emit('mist')"
    >
      <IconMisting :size="14" />
      Zroś
    </button>
    <button
      class="action-btn action-btn--feed"
      :class="{ 'action-btn--done': doneToday?.has('fertilizing') }"
      :disabled="doneToday?.has('fertilizing')"
      @click="emit('fertilize')"
    >
      <IconFertilizing :size="14" />
      Nawieź
    </button>
    <button
      v-if="showCleanButton"
      class="action-btn action-btn--clean"
      :class="{ 'action-btn--done': doneToday?.has('cleaning') }"
      :disabled="doneToday?.has('cleaning')"
      @click="emit('clean')"
    >
      <IconCleaning :size="14" />
      Wyczyść
    </button>
    <button
      v-if="showRepotButton"
      class="action-btn action-btn--repot"
      :class="{ 'action-btn--done': doneToday?.has('repotting') }"
      :disabled="doneToday?.has('repotting')"
      @click="emit('repot')"
    >
      <IconRepotting :size="14" />
      Przesadź
    </button>
    <button class="action-btn" @click="emit('care')">
      <IconPlus :size="14" />
      Pielęgnacja
    </button>
    <button v-if="surveyEnabled" class="action-btn action-btn--survey" @click="emit('survey')">
      <IconClipboard :size="14" />
      Obserwacja
    </button>
  </div>
</template>

<style scoped>
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  box-shadow:
    2px 2px 0 var(--paper-2),
    2px 2px 0 1.5px var(--line);
  cursor: pointer;
  color: var(--ink-2);
  transition: transform 0.1s;
  flex-shrink: 0;
  white-space: nowrap;
}
.action-btn:hover:not(:disabled) { transform: translateY(-1px); }
.action-btn--done,
.action-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.action-btn--water {
  color: var(--blue);
  border-color: var(--blue);
  background: var(--blue-soft);
}
.action-btn--mist {
  color: var(--mist);
  border-color: var(--mist);
  background: var(--mist-soft);
}
.action-btn--feed {
  color: var(--copper);
  border-color: var(--copper);
  background: var(--copper-soft);
}
.action-btn--clean {
  color: var(--accent-deep);
  border-color: var(--accent-deep);
  background: var(--accent-soft);
}
.action-btn--repot {
  color: var(--brown);
  border-color: var(--brown);
  background: var(--brown-soft);
}
.action-btn--survey { color: var(--ink); }

@media (max-width: 400px) {
  .action-btn { padding: 6px 10px; font-size: 13px; gap: 4px; }
}
</style>
