<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { PLANT_TEMPLATES, type PlantTemplate } from '@/data/plantTemplates'
import { DIFFICULTY_COLOR_MAP, DIFFICULTY_BG_MAP } from '@/data/plantDifficulty'
import { useTemplateImages } from '@/composables/useTemplateImage'
import PlantTemplateDetailDialog from './PlantTemplateDetailDialog.vue'
import IconSearch from '@/components/icons/IconSearch.vue'
import IconClose from '@/components/icons/IconClose.vue'

const emit = defineEmits<{
  select: [template: PlantTemplate]
}>()

const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
onMounted(() => searchInput.value?.focus())

const search = ref('')
const selectedTemplate = ref<PlantTemplate | null>(null)
const showDetails = ref(false)
const { images: listImages, loadMany } = useTemplateImages()

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return PLANT_TEMPLATES
  return PLANT_TEMPLATES.filter(
    (t) => t.name.toLowerCase().includes(q) || t.species.toLowerCase().includes(q),
  )
})

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(
  filtered,
  (list) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (list.length) loadMany(list.map((t) => t.species))
    }, 300)
  },
  { immediate: true },
)
onUnmounted(() => clearTimeout(debounceTimer))

function select(template: PlantTemplate) {
  selectedTemplate.value = template
  showDetails.value = true
}

function confirm() {
  if (!selectedTemplate.value) return
  emit('select', selectedTemplate.value)
  showDetails.value = false
  search.value = ''
  selectedTemplate.value = null
}

function cancel() {
  showDetails.value = false
  selectedTemplate.value = null
}

function cancelDetail(): boolean {
  if (!showDetails.value) return false
  cancel()
  return true
}

defineExpose({ cancelDetail })

function plantInitial(name: string) {
  return name[0]?.toUpperCase() ?? '?'
}

</script>

<template>
  <div class="template-search">
    <div class="search-wrap">
      <IconSearch :size="15" class="search-icon" />
      <input
        ref="searchInput"
        :value="search"
        type="text"
        class="search-input"
        placeholder="Szukaj gatunku (np. Monstera, Aloes…)"
        @input="search = ($event.target as HTMLInputElement).value"
        @compositionend="search = ($event.target as HTMLInputElement).value"
      />
      <button v-if="search" class="search-clear" @click="search = ''">
        <IconClose :size="13" />
      </button>
    </div>

    <!-- Wyniki -->
    <div v-if="search" class="results-box">
      <div v-if="filtered.length === 0" class="results-empty">Brak wyników dla „{{ search }}"</div>
      <button
        v-for="template in filtered"
        :key="template.species"
        class="result-row"
        @click="select(template)"
      >
        <div class="result-avatar">
          <img
            v-if="listImages[template.species]"
            :src="listImages[template.species]!"
            :alt="template.name"
            class="result-avatar__img"
          />
          <span v-else class="result-avatar__letter">{{ plantInitial(template.name) }}</span>
        </div>
        <div class="result-info">
          <div class="result-name">{{ template.name }}</div>
          <div class="result-species">{{ template.species }}</div>
        </div>
        <span
          class="difficulty-chip"
          :style="`color: ${DIFFICULTY_COLOR_MAP[template.difficulty] ?? 'var(--ink-3)'}; background: ${DIFFICULTY_BG_MAP[template.difficulty] ?? 'var(--paper-2)'}; border-color: ${DIFFICULTY_COLOR_MAP[template.difficulty] ?? 'var(--line)'}`"
          >{{ template.difficulty }}</span
        >
      </button>
    </div>

    <PlantTemplateDetailDialog
      v-model="showDetails"
      :template="selectedTemplate"
      @confirm="confirm"
    />
  </div>
</template>

<style scoped>
.template-search {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Search */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: var(--ink-3);
  pointer-events: none;
  flex-shrink: 0;
}
.search-input {
  width: 100%;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  padding: 9px 36px 9px 36px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.search-input:focus {
  border-color: var(--accent-deep);
}
.search-clear {
  position: absolute;
  right: 10px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--paper-2);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--ink-3);
}

/* Results */
.results-box {
  border: 1.5px solid var(--line);
  border-radius: var(--r-card);
  background: var(--paper-card);
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}

.results-empty {
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  text-align: center;
}

.result-row {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 35%, transparent);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.result-row:last-child {
  border-bottom: 0;
}
.result-row:hover {
  background: var(--paper);
}

.result-avatar {
  width: 38px;
  height: 38px;
  border: 1.5px solid var(--line);
  background: var(--accent-soft);
  border-radius: var(--r-blob);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.result-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.result-avatar__letter {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--accent-deep);
  opacity: 0.6;
}

.result-info {
  min-width: 0;
}
.result-name {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-species {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
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

@media (max-width: 360px) {
  .result-row {
    padding: 8px 10px;
    gap: 8px;
  }
}
</style>
