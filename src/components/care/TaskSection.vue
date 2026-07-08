<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import SnoozeDialog from '@/components/care/SnoozeDialog.vue'
import type { TaskItem, SnoozedCareType } from '@/types'
import IconSnooze from '@/components/icons/IconSnooze.vue'
import IconCheck from '@/components/icons/IconCheck.vue'
import { groupByRoom } from '@/composables/groupByRoom'

const props = defineProps<{
  tasks: TaskItem[]
  icon: Component
  label: string
  color: string
  careType: SnoozedCareType
  theme?: string
}>()

const emit = defineEmits<{
  done: [plantId: number, type: SnoozedCareType]
  snooze: [plantId: number, type: SnoozedCareType, until: Date]
}>()

const snoozeOpen = ref(false)
const snoozePlantId = ref<number | null>(null)

const roomGroups = computed(() => groupByRoom(props.tasks))

const groupClass = computed(() => {
  const map: Record<string, string> = {
    watering: 'water',
    fertilizing: 'feed',
    misting: 'mist',
    pruning: 'prune',
    repotting: 'repot',
    cleaning: 'clean',
    survey: 'survey',
    combined: 'combined',
  }
  return map[props.theme ?? props.careType] ?? 'water'
})

function openSnooze(plantId: number) {
  snoozePlantId.value = plantId
  snoozeOpen.value = true
}

function handleSnooze(until: Date) {
  if (!snoozePlantId.value) return
  emit('snooze', snoozePlantId.value, props.careType, until)
}
</script>

<template>
  <div class="task-group" :class="groupClass">
    <div class="group-head">
      <span class="g-ico"><component :is="icon" :size="15" /></span>
      <span class="g-label">{{ label }}</span>
      <span class="g-count">{{ tasks.length }}</span>
    </div>

    <div v-for="group in roomGroups" :key="group.room" class="room-group">
      <div class="room-label">{{ group.room }}</div>
      <div v-for="task in group.items" :key="task.plant.id" class="task-row">
        <RouterLink :to="`/rosliny/${task.plant.id}`" class="task-link">
          <PlantAvatar :name="task.plant.name" :image-base64="task.plant.imageBase64" :size="46" />
          <div class="t-meta">
            <div class="t-title">{{ task.plant.name }}</div>
            <div v-if="task.overdue > 0" class="t-overdue">
              {{ task.overdue }} {{ task.overdue === 1 ? 'dzień' : 'dni' }} po terminie
            </div>
          </div>
        </RouterLink>

        <div class="task-btns">
          <button
            class="history-btn"
            :aria-label="`Odłóż ${task.plant.name}`"
            @click.stop="openSnooze(task.plant.id as number)"
          >
            <IconSnooze :size="20" />
          </button>

          <button
            class="check-btn"
            :aria-label="`Wykonaj ${task.plant.name}`"
            @click.stop="emit('done', task.plant.id as number, careType)"
          >
            <IconCheck :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <SnoozeDialog v-model="snoozeOpen" @snooze="handleSnooze" />
</template>

<style scoped>
.task-group {
  margin-bottom: 14px;
}
.task-group:last-child {
  margin-bottom: 0;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0 8px;
}

.g-ico {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50% 40% 55% 45%;
  font-size: 14px;
}

.g-label {
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 15px;
}

.g-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  border: 1.3px solid currentColor;
}

.water .group-head,
.water .check-btn {
  color: var(--blue);
}
.water .g-ico {
  background: var(--blue-soft);
  color: var(--blue);
  border: 1.3px solid var(--blue);
}
.water .check-btn {
  background: var(--blue-soft);
  border-color: var(--blue);
}

.feed .group-head,
.feed .check-btn {
  color: var(--copper);
}
.feed .g-ico {
  background: var(--copper-soft);
  color: var(--copper);
  border: 1.3px solid var(--copper);
}
.feed .check-btn {
  background: var(--copper-soft);
  border-color: var(--copper);
}

.mist .group-head,
.mist .check-btn {
  color: var(--mist);
}
.mist .g-ico {
  background: var(--mist-soft);
  color: var(--mist);
  border: 1.3px solid var(--mist);
}
.mist .check-btn {
  background: var(--mist-soft);
  border-color: var(--mist);
}

.prune .group-head,
.prune .check-btn {
  color: var(--warn);
}
.prune .g-ico {
  background: var(--warn-soft);
  color: var(--warn);
  border: 1.3px solid var(--warn);
}
.prune .check-btn {
  background: var(--warn-soft);
  border-color: var(--warn);
}

.repot .group-head,
.repot .check-btn {
  color: var(--brown);
}
.repot .g-ico {
  background: var(--brown-soft);
  color: var(--brown);
  border: 1.3px solid var(--brown);
}
.repot .check-btn {
  background: var(--brown-soft);
  border-color: var(--brown);
}

.clean .group-head,
.clean .check-btn {
  color: var(--accent-deep);
}
.clean .g-ico {
  background: var(--accent-soft);
  color: var(--accent-deep);
  border: 1.3px solid var(--accent-deep);
}
.clean .check-btn {
  background: var(--accent-soft);
  border-color: var(--accent-deep);
}

.survey .group-head,
.survey .check-btn {
  color: var(--warn);
}
.survey .g-ico {
  background: var(--warn-soft);
  color: var(--warn);
  border: 1.3px solid var(--warn);
}
.survey .check-btn {
  background: var(--warn-soft);
  border-color: var(--warn);
}

.combined .group-head,
.combined .check-btn {
  color: var(--teal);
}
.combined .g-ico {
  background: var(--teal-soft);
  color: var(--teal);
  border: 1.3px solid var(--teal);
}
.combined .check-btn {
  background: var(--teal-soft);
  border-color: var(--teal);
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

.task-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 50%, transparent);
}
.task-row:last-child {
  border-bottom: 0;
}

.task-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.task-btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.t-meta {
  min-width: 0;
}

.t-title {
  font-family: 'Kalam', sans-serif;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
}


.t-overdue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--warn);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-btn,
.check-btn {
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--line);
  background: var(--paper);
  border-radius: 9px 11px 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink-2);
  flex-shrink: 0;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}

.check-btn {
  background: var(--blue-soft);
  border-color: var(--blue);
  color: var(--blue);
}
/* check-btn colors per type override the above via .water/.feed/.mist etc. classes */

.check-btn:hover {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  color: var(--paper);
}

.history-btn:hover {
  background: var(--paper-2);
}

@media (max-width: 360px) {
  .task-row {
    gap: 8px;
  }
  .task-btns {
    gap: 4px;
  }
}

@media (max-width: 600px) {
  .history-btn,
  .check-btn {
    border-radius: 11px 13px 12px 14px;
  }
  .history-btn svg,
  .check-btn svg {
    width: 20px;
    height: 20px;
  }
}
</style>
