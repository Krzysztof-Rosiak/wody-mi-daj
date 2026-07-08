<script setup lang="ts">
import { watch } from 'vue'
import type { PlantTemplate } from '@/data/plantTemplates'
import { DIFFICULTY_COLOR_MAP, DIFFICULTY_BG_MAP } from '@/data/plantDifficulty'
import { useTemplateImage } from '@/composables/useTemplateImage'
import SketchBtn from '@/components/ui/SketchBtn.vue'
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconWater from '@/components/icons/IconWater.vue'
import IconFertilizing from '@/components/icons/IconFertilizing.vue'

const props = defineProps<{
  modelValue: boolean
  template: PlantTemplate | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const { imageUrl: templateImageUrl, loading: imageLoading, load: loadTemplateImage } = useTemplateImage()

watch(
  () => props.template,
  (t) => {
    if (t) loadTemplateImage(t.species)
  },
)

function monthlyAvg(values: readonly number[]): number {
  const active = values.filter((v) => v > 0)
  return active.length ? Math.round(active.reduce((a, b) => a + b, 0) / active.length) : 0
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="template" class="bot-modal">
      <!-- Zdjęcie -->
      <div class="detail-photo">
        <img
          v-if="templateImageUrl"
          :src="templateImageUrl"
          :alt="template.name"
          class="detail-photo__img"
        />
        <div v-else class="detail-photo__placeholder">
          <IconPlantBrand v-if="!imageLoading" :size="40" />
          <div v-else class="detail-photo__spinner"></div>
        </div>
      </div>

      <div class="bot-modal__head">
        <div>
          <div class="detail-species-label">{{ template.species }}</div>
          <h2 class="bot-modal__title">{{ template.name }}</h2>
        </div>
      </div>

      <div class="bot-modal__body">
        <!-- Tagi -->
        <div class="detail-tags">
          <span
            class="difficulty-chip"
            :style="`color: ${DIFFICULTY_COLOR_MAP[template.difficulty] ?? 'var(--ink-3)'}; background: ${DIFFICULTY_BG_MAP[template.difficulty] ?? 'var(--paper-2)'}; border-color: ${DIFFICULTY_COLOR_MAP[template.difficulty] ?? 'var(--line)'}`"
            >{{ template.difficulty }}</span
          >
          <span class="light-chip">{{ template.light }}</span>
        </div>

        <!-- Statsy -->
        <div class="detail-stats">
          <div class="stat-card stat-card--water">
            <IconWater :size="16" />
            <div class="stat-val">co ~{{ monthlyAvg(template.wateringByMonth) }} dni</div>
            <div class="stat-lbl">podlewanie (śr.)</div>
          </div>
          <div class="stat-card stat-card--feed">
            <IconFertilizing :size="16" />
            <div class="stat-val">co ~{{ monthlyAvg(template.fertilizingByMonth) }} dni</div>
            <div class="stat-lbl">nawożenie</div>
          </div>
        </div>

        <!-- Notatki -->
        <div class="detail-notes">{{ template.careNotes }}</div>
      </div>

      <div class="bot-modal__foot">
        <SketchBtn variant="ghost" @click="emit('update:modelValue', false)">Anuluj</SketchBtn>
        <SketchBtn variant="primary" @click="emit('confirm')">Wybierz tę roślinę</SketchBtn>
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

.detail-photo {
  height: 180px;
  background: var(--accent-soft);
  overflow: hidden;
  flex-shrink: 0;
}
.detail-photo__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.detail-photo__placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-deep);
  opacity: 0.3;
}
.detail-photo__spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--accent-deep);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.bot-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px dashed var(--line);
  gap: 10px;
  flex-shrink: 0;
}

.detail-species-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

.bot-modal__body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bot-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px dashed var(--line);
  flex-shrink: 0;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.difficulty-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 6px 8px 7px 9px;
  border: 1.2px solid;
  flex-shrink: 0;
}

.light-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 6px 8px 7px 9px;
  border: 1.2px solid var(--ink-3);
  color: var(--ink-3);
  background: var(--paper);
}

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  border-radius: 10px 13px 11px 14px;
  border: 1.3px solid var(--line);
}
.stat-card--water {
  background: var(--blue-soft);
  border-color: var(--blue);
  color: var(--blue);
}
.stat-card--feed {
  background: var(--accent-soft);
  border-color: var(--accent-deep);
  color: var(--accent-deep);
}

.stat-val {
  font-family: 'Lato', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}
.stat-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.7;
}

.detail-notes {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.5;
  padding: 10px 12px;
  background: var(--paper);
  border: 1.3px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  border-left: 3px solid var(--accent-deep);
}

@media (max-width: 400px) {
  .bot-modal__head {
    padding: 10px 12px 8px;
  }
  .bot-modal__body {
    padding: 12px;
  }
  .bot-modal__foot {
    padding: 10px 12px 14px;
  }
  .detail-stats {
    grid-template-columns: 1fr;
  }
  .bot-modal__title {
    font-size: 22px;
  }
  .detail-photo {
    height: 140px;
  }
}
</style>
