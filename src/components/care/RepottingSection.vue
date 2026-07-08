<script setup lang="ts">
import { ref, computed } from 'vue'
import { getCategoryForPlant } from '@/composables/usePlantSchedule'
import { groupByRoom } from '@/composables/groupByRoom'
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import IconSprout from '@/components/icons/IconSprout.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconCheck from '@/components/icons/IconCheck.vue'
import IconCheckCircle from '@/components/icons/IconCheckCircle.vue'
import type { Plant } from '@/types'

const props = defineProps<{
  plants: Plant[]
  expanded: boolean
  emptyText: string
}>()

const emit = defineEmits<{
  'update:expanded': [boolean]
  dismiss: [plantId: number]
  done: [plant: Plant]
}>()

const hintsExpandedIds = ref<Set<number>>(new Set())
function toggleHints(plantId: number) {
  const next = new Set(hintsExpandedIds.value)
  if (next.has(plantId)) next.delete(plantId)
  else next.add(plantId)
  hintsExpandedIds.value = next
}

const plantsByRoom = computed(() =>
  groupByRoom(props.plants.map((plant) => ({ plant }))).map((group) => ({
    room: group.room,
    plants: group.items.map((i) => i.plant),
  })),
)
</script>

<template>
  <div class="sketch-card">
    <button class="card-head" @click="emit('update:expanded', !expanded)">
      <IconSprout :size="18" class="icon-warn icon-shrink" />
      <span class="card-head__label card-head__label--warn">Przesadzanie</span>
      <span v-if="plants.length" class="card-head__pill card-head__pill--warn">{{ plants.length }}</span>
      <IconChevronDown
        class="card-head__chevron"
        :class="{ 'card-head__chevron--open': expanded }"
        :size="14"
      />
    </button>

    <div v-if="expanded" class="card-body" :class="{ 'pa-0': plants.length }">
      <template v-if="plants.length">
        <div v-for="group in plantsByRoom" :key="group.room" class="room-group">
          <div v-if="plantsByRoom.length > 1" class="room-label">{{ group.room }}</div>
          <div
            v-for="(plant, i) in group.plants"
            :key="plant.id"
            class="repot-plant-block"
            :class="{ 'repot-plant-block--divider': i > 0 }"
          >
            <div class="repot-row">
              <RouterLink :to="`/rosliny/${plant.id}`" class="plant-link">
                <PlantAvatar :name="plant.name" :image-base64="plant.imageBase64" :size="46" />
                <div class="plant-meta">
                  <div class="plant-name">{{ plant.name }}</div>
                  <span v-if="getCategoryForPlant(plant)" class="category-chip">
                    {{ getCategoryForPlant(plant)!.name }}
                  </span>
                </div>
              </RouterLink>
              <div class="row-actions">
                <button
                  class="action-btn action-btn--dismiss"
                  :aria-label="`Pomiń przesadzanie ${plant.name}`"
                  @click="emit('dismiss', plant.id as number)"
                >
                  <IconClose :size="18" />
                </button>
                <button
                  class="action-btn action-btn--warn"
                  :aria-label="`Przesadź ${plant.name}`"
                  @click="emit('done', plant)"
                >
                  <IconCheck :size="20" />
                </button>
              </div>
            </div>

            <!-- Wskazówki i ziemia -->
            <div v-if="getCategoryForPlant(plant)" class="repot-info">
              <div class="repot-soil">
                <span class="repot-info-label">Ziemia:</span>
                <span class="repot-soil-text">{{ getCategoryForPlant(plant)!.soilDescription }}</span>
              </div>
              <button class="hints-toggle" @click="toggleHints(plant.id as number)">
                <span>Jak sprawdzić?</span>
                <IconChevronDown
                  :size="12"
                  :style="{ transform: hintsExpandedIds.has(plant.id as number) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }"
                />
              </button>
              <ul v-if="hintsExpandedIds.has(plant.id as number)" class="hints-list">
                <li v-for="hint in getCategoryForPlant(plant)!.repottingCheckHints" :key="hint">
                  {{ hint }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <IconCheckCircle :size="20" stroke="var(--accent-deep)" />
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.sketch-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: 28px;
}

.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  background: var(--paper);
  border: none;
  border-bottom: 1.5px dashed var(--ink-3);
  cursor: pointer;
  outline: none;
  transition: background 0.1s;
}
.card-head:hover {
  background: color-mix(in oklab, var(--paper) 80%, var(--line));
}

.card-head__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 500;
  flex: 1;
}
.card-head__label--warn {
  color: var(--warn);
}

.card-head__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border: 1.3px solid;
  border-radius: 11px 13px 10px 14px;
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 15px;
}
.card-head__pill--warn {
  border-color: var(--warn);
  background: color-mix(in oklab, var(--warn) 15%, transparent);
  color: var(--warn);
}

.card-head__chevron {
  color: var(--ink-3);
  opacity: 0.5;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.card-head__chevron--open {
  transform: rotate(180deg);
}

.card-body {
  padding: 10px 14px;
  background: var(--paper-card);
}
.pa-0 {
  padding: 0;
}

.plant-meta {
  min-width: 0;
}
.plant-name {
  font-family: 'Kalam', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.action-btn {
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--line);
  background: var(--paper);
  border-radius: 9px 11px 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}
.action-btn:hover {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  color: var(--paper);
}

.action-btn--dismiss {
  background: transparent;
  border-color: var(--line);
  color: var(--ink-3);
  opacity: 0.6;
}
.action-btn--dismiss:hover {
  opacity: 1;
  background: var(--paper-2);
  border-color: var(--ink-3);
  color: var(--ink-2);
}
.action-btn--warn {
  background: var(--warn-soft);
  border-color: var(--warn);
  color: var(--warn);
}

.room-group {
  border-bottom: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
}
.room-group:last-child {
  border-bottom: none;
}

.room-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-2);
  padding: 6px 14px 5px;
  background: color-mix(in oklab, var(--paper-2) 60%, transparent);
  border-bottom: 1px solid color-mix(in oklab, var(--line) 80%, transparent);
}

.repot-plant-block {
  padding: 10px 14px;
}
.repot-plant-block--divider {
  border-top: 1px dashed color-mix(in oklab, var(--ink-3) 50%, transparent);
}

.repot-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.plant-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  flex: 1;
  min-width: 0;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 1px solid color-mix(in oklab, var(--warn) 50%, transparent);
  border-radius: 8px 10px 9px 11px;
  background: color-mix(in oklab, var(--warn) 10%, transparent);
  color: var(--warn);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* indent = 14px (block padding) + 46px (avatar) + 10px (gap) = 70px, but we're already inside the block */
.repot-info {
  padding: 6px 0 2px 56px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.repot-soil {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-2);
  line-height: 1.6;
}

.repot-info-label {
  font-weight: 600;
  color: var(--warn);
  margin-right: 4px;
}

.hints-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
.hints-toggle:hover {
  color: var(--warn);
}

.hints-list {
  margin: 2px 0 0 0;
  padding-left: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-2);
  line-height: 1.8;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: var(--ink-2);
  font-family: 'Lato', sans-serif;
  font-size: 15px;
}

.icon-shrink {
  flex-shrink: 0;
}
.icon-warn {
  color: var(--warn);
}
</style>
