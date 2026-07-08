<script setup lang="ts">
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import IconCheckCircle from '@/components/icons/IconCheckCircle.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import type { Plant } from '@/types'

defineProps<{
  items: { plant: Plant; kind: 'repotting' | 'pruning' }[]
  expanded: boolean
}>()

const emit = defineEmits<{
  'update:expanded': [boolean]
}>()
</script>

<template>
  <div class="sketch-card">
    <button class="card-head" @click="emit('update:expanded', !expanded)">
      <IconCheckCircle :size="18" stroke="#1D7A45" class="icon-shrink" />
      <span class="card-head__label card-head__label--green">WYKONANE</span>
      <span class="card-head__pill card-head__pill--green">
        {{ items.length }}
      </span>
      <IconChevronDown
        class="card-head__chevron"
        :class="{ 'card-head__chevron--open': expanded }"
        :size="14"
      />
    </button>

    <div v-if="expanded" class="card-body pa-0">
      <RouterLink
        v-for="(item, i) in items"
        :key="`done-${item.plant.id}-${i}`"
        :to="`/rosliny/${item.plant.id}`"
        class="plant-row"
        :class="{ 'plant-row--divider': i > 0 }"
      >
        <PlantAvatar :name="item.plant.name" :image-base64="item.plant.imageBase64" :size="46" />
        <div class="plant-meta">
          <div class="plant-name">{{ item.plant.name }}</div>
          <div class="plant-room">{{ item.plant.room }}</div>
        </div>
        <div v-if="item.kind === 'repotting'" class="done-chip">Przesadzono</div>
        <div v-else class="done-chip done-chip--mist">Przycięto</div>
      </RouterLink>
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
.card-head__label--green {
  color: #1d7a45;
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
.card-head__pill--green {
  border-color: #1d7a45;
  background: rgba(29, 122, 69, 0.1);
  color: #1d7a45;
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

.plant-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 9px 4px;
  text-decoration: none;
  color: inherit;
}
.plant-row--divider {
  border-top: 1px dashed color-mix(in oklab, var(--ink-3) 50%, transparent);
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
.plant-room {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

.done-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border: 1.3px solid var(--warn);
  border-radius: 10px 12px 11px 13px;
  background: var(--warn-soft);
  color: var(--warn);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.done-chip--mist {
  border-color: var(--mist);
  background: var(--mist-soft);
  color: var(--mist);
}

.icon-shrink {
  flex-shrink: 0;
}
</style>
