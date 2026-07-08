<script setup lang="ts">
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'
import IconWater from '@/components/icons/IconWater.vue'

defineProps<{
  totalPlants: number
  newPlantsLastYear: number
  eventsThisMonth: number
  avgCondition: number | null
  leastCaredPlant: { plant: { name: string }; daysSince: number | null; interval: number } | null
}>()
</script>

<template>
  <div class="stat-tiles">
    <div class="stat-tile stat-tile--green">
      <div class="stat-tile__split">
        <div>
          <div class="stat-tile__val">{{ totalPlants }}</div>
          <div class="stat-tile__lbl">w kolekcji</div>
        </div>
        <div class="stat-tile__divider"></div>
        <div>
          <div class="stat-tile__val stat-tile__val--sm">+{{ newPlantsLastYear }}</div>
          <div class="stat-tile__lbl">w tym roku</div>
        </div>
      </div>
      <IconPlantBrand :size="22" class="stat-tile__ico" />
    </div>

    <div class="stat-tile stat-tile--blue">
      <div class="stat-tile__val">{{ eventsThisMonth }}</div>
      <div class="stat-tile__lbl">zabiegów w tym miesiącu</div>
      <IconClipboard :size="20" class="stat-tile__ico" />
    </div>

    <div
      class="stat-tile"
      :class="leastCaredPlant && (leastCaredPlant.daysSince ?? 0) > leastCaredPlant.interval ? 'stat-tile--warn' : 'stat-tile--muted'"
    >
      <template v-if="leastCaredPlant">
        <div class="stat-tile__val">{{ leastCaredPlant.daysSince ?? '?' }}<span class="stat-tile__unit">d</span></div>
        <div class="stat-tile__lbl">najdłużej bez podlewania</div>
        <div class="stat-tile__lbl stat-tile__lbl--name">{{ leastCaredPlant.plant.name }}</div>
      </template>
      <template v-else>
        <div class="stat-tile__val stat-tile__val--sm">—</div>
        <div class="stat-tile__lbl">brak danych</div>
      </template>
      <IconWater :size="20" class="stat-tile__ico" />
    </div>

    <div class="stat-tile" :class="avgCondition ? 'stat-tile--warn' : 'stat-tile--muted'">
      <template v-if="avgCondition !== null">
        <div class="stat-tile__val">{{ avgCondition }}<span class="stat-tile__unit">/5</span></div>
        <div class="stat-tile__lbl">średnia kondycja</div>
      </template>
      <template v-else>
        <div class="stat-tile__val stat-tile__val--sm">—</div>
        <div class="stat-tile__lbl">brak ankiet</div>
      </template>
      <IconWater :size="20" class="stat-tile__ico" />
    </div>
  </div>
</template>

<style scoped>
.stat-tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-tile {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 12px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
}

.stat-tile__split {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
.stat-tile__divider {
  width: 1px;
  height: 36px;
  background: currentColor;
  opacity: 0.2;
  flex-shrink: 0;
  align-self: center;
}
.stat-tile__val {
  font-family: 'Lato', sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: inherit;
}
.stat-tile__val--sm { font-size: 32px; }
.stat-tile__lbl--name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.stat-tile__unit {
  font-size: 20px;
  font-weight: 400;
  opacity: 0.5;
  margin-left: 2px;
}
.stat-tile__lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: inherit;
  opacity: 0.7;
}
.stat-tile__ico {
  position: absolute;
  top: 8px;
  right: 10px;
  opacity: 0.18;
}

.stat-tile--green { color: var(--accent-deep); border-color: var(--accent-deep); background: var(--accent-soft); }
.stat-tile--blue  { color: var(--blue);        border-color: var(--blue);        background: var(--blue-soft); }
.stat-tile--warn  { color: var(--warn);         border-color: var(--warn);        background: var(--warn-soft); }
.stat-tile--muted { color: var(--ink-3); }

@media (min-width: 560px) {
  .stat-tiles { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 400px) {
  .stat-tile__val { font-size: 36px; }
  .stat-tile { padding: 12px 10px 10px; }
}
</style>
