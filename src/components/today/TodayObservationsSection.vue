<script setup lang="ts">
import { computed } from 'vue'
import type { Plant } from '@/types'
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'
import { groupByRoom } from '@/composables/groupByRoom'

const props = defineProps<{
  tasks: { plant: Plant }[]
}>()

const emit = defineEmits<{
  'open-survey': [plant: Plant]
}>()

const roomGroups = computed(() => groupByRoom(props.tasks))
</script>

<template>
  <div class="survey-section">
    <div class="survey-section__head">
      <IconClipboard :size="14" stroke="var(--blue)" />
      <span class="survey-section__label">Obserwacje</span>
      <span class="survey-section__pill">{{ tasks.length }}</span>
    </div>
    <div v-for="group in roomGroups" :key="group.room" class="room-group">
      <div class="room-label">{{ group.room }}</div>
      <div
        v-for="(task, i) in group.items"
        :key="task.plant.id"
        class="survey-row"
        :class="{ 'survey-row--divider': i > 0 }"
      >
        <RouterLink :to="`/rosliny/${task.plant.id}`" class="survey-link">
          <PlantAvatar
            :name="task.plant.name"
            :image-base64="task.plant.imageBase64"
            :size="46"
          />
          <div class="survey-row__info">
            <div class="day-row__name">{{ task.plant.name }}</div>
          </div>
        </RouterLink>
        <button
          class="action-btn action-btn--blue"
          :aria-label="`Obserwacja ${task.plant.name}`"
          @click="emit('open-survey', task.plant)"
        >
          <IconClipboard :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.survey-section {
  border-top: 1px dashed color-mix(in oklab, var(--ink-3) 40%, transparent);
  padding-top: 4px;
  margin-top: 4px;
}
.survey-section__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 4px 4px;
}
.survey-section__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--blue);
  flex: 1;
}
.survey-section__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border: 1.3px solid var(--blue);
  border-radius: 10px 12px 11px 13px;
  background: var(--blue-soft);
  color: var(--blue);
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 13px;
}

.room-group {
  border: 1.5px solid color-mix(in oklab, var(--line) 70%, transparent);
  border-radius: 10px;
  margin-bottom: 6px;
  overflow: hidden;
}
.room-group:last-child {
  margin-bottom: 0;
}

.room-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-2);
  padding: 6px 10px 5px;
  background: color-mix(in oklab, var(--paper-2) 60%, transparent);
  border-bottom: 1px solid color-mix(in oklab, var(--line) 80%, transparent);
}

.survey-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
}
.survey-row--divider {
  border-top: 1px dashed color-mix(in oklab, var(--ink-3) 35%, transparent);
}
.survey-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}
.survey-row__info {
  min-width: 0;
}
.day-row__name {
  font-family: 'Kalam', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.action-btn--blue {
  background: var(--blue-soft);
  border-color: var(--blue);
  color: var(--blue);
}
.action-btn--blue:hover {
  background: var(--blue);
  color: var(--paper);
}
</style>
