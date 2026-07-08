<script setup lang="ts">
import { ref } from 'vue'
import type { PlantCategory } from '@/data/plantCategories'

defineProps<{
  category: PlantCategory
}>()

const hintsExpanded = ref(false)
</script>

<template>
  <div class="repot-info-card">
    <div class="repot-info-card__header">
      <span class="repot-info-card__title">Przesadzanie</span>
      <span class="repot-info-card__category">{{ category.name }}</span>
    </div>
    <div class="repot-info-card__soil">
      <span class="repot-info-card__label">Ziemia:</span>
      {{ category.soilDescription }}
    </div>
    <button class="repot-hints-toggle" @click="hintsExpanded = !hintsExpanded">
      <span>Jak sprawdzić czy czas na przesadzenie?</span>
      <v-icon
        size="13"
        :style="{ transform: hintsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }"
      >mdi-chevron-down</v-icon>
    </button>
    <ul v-if="hintsExpanded" class="repot-hints-list">
      <li v-for="hint in category.repottingCheckHints" :key="hint">{{ hint }}</li>
    </ul>
  </div>
</template>

<style scoped>
.repot-info-card {
  background: var(--paper-card);
  border: 1.8px solid color-mix(in oklab, var(--warn) 40%, var(--line));
  border-radius: var(--r-card);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.repot-info-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repot-info-card__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--warn);
}

.repot-info-card__category {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border: 1px solid color-mix(in oklab, var(--warn) 50%, transparent);
  border-radius: 8px 10px 9px 11px;
  background: color-mix(in oklab, var(--warn) 10%, transparent);
  color: var(--warn);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}

.repot-info-card__soil {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-2);
  line-height: 1.6;
}

.repot-info-card__label {
  font-weight: 600;
  color: var(--warn);
  margin-right: 4px;
}

.repot-hints-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-3);
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  width: fit-content;
}
.repot-hints-toggle:hover { color: var(--warn); }

.repot-hints-list {
  margin: 0;
  padding-left: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-2);
  line-height: 1.8;
}
</style>
