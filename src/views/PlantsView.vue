<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useRoomsStore } from '@/stores/rooms'
import { useWateringCacheStore } from '@/stores/wateringCache'
import { usePlantsFilter } from '@/composables/usePlantsFilter'
import PlantCard from '@/components/plants/PlantCard.vue'
import PlantForm from '@/components/plants/PlantForm.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Plant } from '@/types'
import IconBarChart from '@/components/icons/IconBarChart.vue'
import IconPlus from '@/components/icons/IconPlus.vue'
import IconSearch from '@/components/icons/IconSearch.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconArchive from '@/components/icons/IconArchive.vue'
import IconLayoutList from '@/components/icons/IconLayoutList.vue'
import IconLayoutRooms from '@/components/icons/IconLayoutRooms.vue'

const plantsStore = usePlantsStore()
const roomsStore = useRoomsStore()
const wateringCache = useWateringCacheStore()

const showAddForm = ref(false)

const selectedRoom = computed({
  get: () => roomsStore.selectedRoom,
  set: (v) => { roomsStore.selectedRoom = v },
})

const viewMode = computed({
  get: () => roomsStore.viewMode,
  set: (v) => { roomsStore.viewMode = v },
})

onMounted(async () => {
  await Promise.all([plantsStore.fetchAll(), roomsStore.fetchAll()])
  wateringCache.refresh()
})

const searchQuery = ref('')

const plants = computed(() => plantsStore.plants)
const allRooms = computed(() => roomsStore.allRooms)
const { rooms, filteredPlants, plantsByRoom } = usePlantsFilter({
  plants,
  allRooms,
  viewMode,
  selectedRoom,
  searchQuery,
})

async function addPlant(data: Omit<Plant, 'id' | 'createdAt'>) {
  await plantsStore.add(data)
  wateringCache.refresh()
}
</script>

<template>
  <div class="plants-page">
    <!-- Header -->
    <div class="page-head">
      <div>
        <div class="page-caption">Kolekcja</div>
        <h1 class="page-title">Moje Rośliny</h1>
      </div>
      <div class="head-actions">
        <RouterLink to="/statystyki" class="add-btn">
          <IconBarChart :size="15" />
          Statystyki
        </RouterLink>
        <button
          class="view-toggle"
          :class="{ 'view-toggle--active': viewMode === 'rooms' }"
          :aria-label="viewMode === 'list' ? 'Widok po pokojach' : 'Widok listy'"
          @click="viewMode = viewMode === 'list' ? 'rooms' : 'list'"
        >
          <IconLayoutRooms v-if="viewMode === 'list'" :size="16" />
          <IconLayoutList v-else :size="16" />
        </button>
        <button class="add-btn" @click="showAddForm = true">
          <IconPlus :size="16" />
          Dodaj
        </button>
      </div>
    </div>

    <!-- Wyszukiwarka -->
    <div class="search-wrap">
      <IconSearch :size="15" class="search-icon" />
      <input
        v-model="searchQuery"
        class="search-input"
        type="text"
        placeholder="Szukaj rośliny…"
        autocomplete="off"
      />
      <button
        v-if="searchQuery"
        class="search-clear"
        aria-label="Wyczyść"
        @click="searchQuery = ''"
      >
        <IconClose :size="12" />
      </button>
    </div>

    <!-- Filtr pokoi (tylko widok listy) -->
    <div v-if="viewMode === 'list' && rooms.length > 0" class="room-filter">
      <button
        class="room-chip"
        :class="{ active: selectedRoom === null }"
        @click="selectedRoom = null"
      >
        Wszystkie
      </button>
      <button
        v-for="room in rooms"
        :key="room"
        class="room-chip"
        :class="{ active: selectedRoom === room }"
        @click="selectedRoom = room"
      >
        {{ room }}
      </button>
    </div>

    <!-- Widok listy -->
    <template v-if="viewMode === 'list'">
      <div v-if="filteredPlants.length > 0" class="plants-list">
        <PlantCard
          v-for="plant in filteredPlants"
          :key="plant.id"
          :plant="plant"
          :last-watering-date="wateringCache.getLastWateringDate(plant.id as number)"
        />
      </div>
      <EmptyState
        v-else
        title="Brak roślin"
        :sub="selectedRoom ? 'Brak roślin w tym pokoju' : 'Dodaj swoją pierwszą roślinę!'"
      >
        <IconPlantBrand :size="48" class="empty-icon" />
      </EmptyState>
    </template>

    <!-- Widok po pokojach -->
    <template v-else>
      <template v-if="plantsByRoom.length > 0">
        <div v-for="group in plantsByRoom" :key="group.room" class="plants-list">
          <div class="room-section__head">
            <span class="room-section__name">{{ group.room }}</span>
            <span class="room-section__count">{{ group.plants.length }}</span>
          </div>
          <PlantCard
            v-for="plant in group.plants"
            :key="plant.id"
            :plant="plant"
            :last-watering-date="wateringCache.getLastWateringDate(plant.id as number)"
            hide-room
          />
        </div>
      </template>
      <EmptyState v-else title="Brak roślin" sub="Dodaj swoją pierwszą roślinę!">
        <IconPlantBrand :size="48" class="empty-icon" />
      </EmptyState>
    </template>

    <PlantForm v-model="showAddForm" @save="addPlant" />

    <div class="archive-link">
      <RouterLink to="/archiwum" class="archive-btn">
        <IconArchive :size="13" />
        Archiwum roślin
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.plants-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.page-caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  margin-bottom: 2px;
}

.page-title {
  font-family: 'Lato', sans-serif;
  font-size: 52px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  box-shadow:
    2px 2px 0 var(--paper-2),
    2px 2px 0 1.5px var(--line);
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.1s;
  flex-shrink: 0;
  margin-bottom: 6px;
}
.add-btn:hover {
  transform: translateY(-1px);
}

.head-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  box-shadow:
    2px 2px 0 var(--paper-2),
    2px 2px 0 1.5px var(--line);
  cursor: pointer;
  color: var(--ink-2);
  margin-bottom: 6px;
  flex-shrink: 0;
  transition: transform 0.1s, background 0.12s, color 0.12s;
}
.view-toggle:hover {
  transform: translateY(-1px);
}
.view-toggle--active {
  background: var(--paper-2);
  border-color: var(--ink-2);
  color: var(--ink);
}

.room-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.room-chip {
  padding: 4px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  background: transparent;
  border: 1.3px solid var(--ink-3);
  border-radius: 10px 13px 11px 14px / 13px 10px 14px 11px;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s,
    border-color 0.1s;
}
.room-chip:hover {
  background: var(--paper-2);
  color: var(--ink-2);
}
.room-chip.active {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  color: var(--paper);
}

.plants-list {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.room-section__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 7px;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 40%, transparent);
  background: color-mix(in oklab, var(--paper-2) 50%, transparent);
}

.room-section__name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-2);
  font-weight: 600;
  flex: 1;
}

.room-section__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border: 1.2px solid var(--line);
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--ink-3);
}

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
  padding: 9px 36px 9px 34px;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink);
  background: var(--paper-card);
  border: 1.5px solid var(--line);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  outline: none;
  transition: border-color 0.15s;
}
.search-input::placeholder {
  color: var(--ink-3);
}
.search-input:focus {
  border-color: var(--accent-deep);
}
.search-input::-webkit-search-cancel-button {
  display: none;
}
.search-clear {
  position: absolute;
  right: 10px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  color: var(--ink-3);
}
.search-clear:hover {
  color: var(--ink);
}

.archive-link {
  text-align: center;
}

.archive-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  text-decoration: none;
  border-bottom: 1px dashed var(--ink-3);
  padding-bottom: 1px;
}
.archive-btn:hover {
  color: var(--ink-2);
}
.empty-icon { color: var(--accent-deep); opacity: 0.4; }

@media (max-width: 480px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 400px) {
  .page-title {
    font-size: 36px;
  }
}
</style>
