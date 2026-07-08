import { computed, type Ref } from 'vue'
import type { Plant } from '@/types'
import { groupByRoom } from './groupByRoom'

function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function usePlantsFilter(deps: {
  plants: Ref<Plant[]>
  allRooms: Ref<string[]>
  viewMode: Ref<'list' | 'rooms'>
  selectedRoom: Ref<string | null>
  searchQuery: Ref<string>
}) {
  const rooms = computed(() => {
    const occupiedRaw = deps.plants.value.map((p) => p.room)
    const occupiedLower = new Set(occupiedRaw.map((r) => r.toLowerCase()))
    const fromStore = deps.allRooms.value.filter((r) => occupiedLower.has(r.toLowerCase()))
    const fromStoreLower = new Set(fromStore.map((r) => r.toLowerCase()))
    const extra = [...new Set(occupiedRaw)]
      .filter((r) => !fromStoreLower.has(r.toLowerCase()))
      .sort()
    return [...fromStore, ...extra]
  })

  const searchedPlants = computed(() => {
    const q = normalizeSearch(deps.searchQuery.value.trim())
    if (!q) return deps.plants.value
    return deps.plants.value.filter(
      (p) => normalizeSearch(p.name).includes(q) || (p.species && normalizeSearch(p.species).includes(q)),
    )
  })

  const filteredPlants = computed(() => {
    let plants = searchedPlants.value
    if (deps.viewMode.value === 'list' && deps.selectedRoom.value) {
      const sel = deps.selectedRoom.value.toLowerCase()
      plants = plants.filter((p) => p.room.toLowerCase() === sel)
    }
    return [...plants].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  })

  const plantsByRoom = computed(() => {
    const sorted = [...searchedPlants.value].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    // groupByRoom compares room names by exact string equality — normalize each plant's
    // room to the canonical casing from `rooms` first, so e.g. "salon" merges with "Salon".
    const canonicalByLower = new Map(rooms.value.map((r) => [r.toLowerCase(), r]))
    const withCanonicalRoom = sorted.map((plant) => ({
      plant: { ...plant, room: canonicalByLower.get(plant.room.toLowerCase()) ?? plant.room },
    }))
    return groupByRoom(withCanonicalRoom, rooms.value).map((group) => ({
      room: group.room,
      plants: group.items.map((i) => i.plant),
    }))
  })

  return { rooms, filteredPlants, plantsByRoom }
}
