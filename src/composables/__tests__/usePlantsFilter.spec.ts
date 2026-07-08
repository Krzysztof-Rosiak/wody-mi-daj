import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { usePlantsFilter } from '../usePlantsFilter'
import type { Plant } from '@/types'

const makePlant = (id: number, name: string, room: string, species?: string): Plant => ({
  id,
  name,
  room,
  species,
  createdAt: new Date(),
})

function setup(plants: Plant[], allRooms: string[]) {
  const plantsRef = ref(plants)
  const allRoomsRef = ref(allRooms)
  const viewMode = ref<'list' | 'rooms'>('list')
  const selectedRoom = ref<string | null>(null)
  const searchQuery = ref('')
  const filter = usePlantsFilter({
    plants: plantsRef,
    allRooms: allRoomsRef,
    viewMode,
    selectedRoom,
    searchQuery,
  })
  return { ...filter, plantsRef, viewMode, selectedRoom, searchQuery }
}

describe('usePlantsFilter — rooms', () => {
  it('zawiera tylko pokoje z roślinami, w kolejności allRooms', () => {
    const { rooms } = setup(
      [makePlant(1, 'A', 'Kuchnia'), makePlant(2, 'B', 'Salon')],
      ['Salon', 'Kuchnia', 'Sypialnia'],
    )
    expect(rooms.value).toEqual(['Salon', 'Kuchnia'])
  })

  it('dopisuje na końcu pokoje spoza store (np. zaimportowane), posortowane alfabetycznie', () => {
    const { rooms } = setup(
      [makePlant(1, 'A', 'Ogród'), makePlant(2, 'B', 'Balkon'), makePlant(3, 'C', 'Salon')],
      ['Salon'],
    )
    expect(rooms.value).toEqual(['Salon', 'Balkon', 'Ogród'])
  })

  it('dopasowuje pokoje bez uwzględniania wielkości liter', () => {
    const { rooms } = setup([makePlant(1, 'A', 'salon')], ['Salon'])
    expect(rooms.value).toEqual(['Salon'])
  })
})

describe('usePlantsFilter — filteredPlants', () => {
  it('zwraca wszystkie rośliny posortowane po nazwie gdy brak filtrów', () => {
    const { filteredPlants } = setup(
      [makePlant(1, 'Zamiokulkas', 'Salon'), makePlant(2, 'Aloes', 'Salon')],
      ['Salon'],
    )
    expect(filteredPlants.value.map((p) => p.name)).toEqual(['Aloes', 'Zamiokulkas'])
  })

  it('filtruje po wybranym pokoju w widoku listy', () => {
    const { filteredPlants, selectedRoom } = setup(
      [makePlant(1, 'A', 'Salon'), makePlant(2, 'B', 'Kuchnia')],
      ['Salon', 'Kuchnia'],
    )
    selectedRoom.value = 'Kuchnia'
    expect(filteredPlants.value.map((p) => p.name)).toEqual(['B'])
  })

  it('nie filtruje po pokoju w widoku "rooms"', () => {
    const { filteredPlants, selectedRoom, viewMode } = setup(
      [makePlant(1, 'A', 'Salon'), makePlant(2, 'B', 'Kuchnia')],
      ['Salon', 'Kuchnia'],
    )
    viewMode.value = 'rooms'
    selectedRoom.value = 'Kuchnia'
    expect(filteredPlants.value).toHaveLength(2)
  })

  it('filtruje po nazwie rośliny, bez uwzględniania wielkości liter i diakrytyków', () => {
    const { filteredPlants, searchQuery } = setup(
      [makePlant(1, 'Monstera', 'Salon'), makePlant(2, 'Aloes', 'Salon')],
      ['Salon'],
    )
    searchQuery.value = 'monst'
    expect(filteredPlants.value.map((p) => p.name)).toEqual(['Monstera'])
  })

  it('filtruje po species gdy nazwa nie pasuje', () => {
    const { filteredPlants, searchQuery } = setup(
      [makePlant(1, 'Fikus', 'Salon', 'Ficus lyrata'), makePlant(2, 'Aloes', 'Salon')],
      ['Salon'],
    )
    searchQuery.value = 'lyrata'
    expect(filteredPlants.value.map((p) => p.name)).toEqual(['Fikus'])
  })

  it('traktuje "ł" jak "l" przy wyszukiwaniu', () => {
    const { filteredPlants, searchQuery } = setup([makePlant(1, 'Żałobnica', 'Salon')], ['Salon'])
    searchQuery.value = 'zalobnica'
    expect(filteredPlants.value).toHaveLength(1)
  })
})

describe('usePlantsFilter — plantsByRoom', () => {
  it('grupuje rośliny wg pokoju w kolejności rooms', () => {
    const { plantsByRoom } = setup(
      [makePlant(1, 'B', 'Kuchnia'), makePlant(2, 'A', 'Salon')],
      ['Salon', 'Kuchnia'],
    )
    expect(plantsByRoom.value.map((g) => g.room)).toEqual(['Salon', 'Kuchnia'])
    expect(plantsByRoom.value[0].plants.map((p) => p.name)).toEqual(['A'])
  })

  it('pomija puste grupy pokojów', () => {
    const { plantsByRoom } = setup([makePlant(1, 'A', 'Salon')], ['Salon', 'Kuchnia'])
    expect(plantsByRoom.value).toHaveLength(1)
    expect(plantsByRoom.value[0].room).toBe('Salon')
  })

  it('dopisuje rośliny z nieznanych pokoi jako osobną grupę', () => {
    const { plantsByRoom } = setup(
      [makePlant(1, 'A', 'Salon'), makePlant(2, 'B', 'Taras')],
      ['Salon'],
    )
    expect(plantsByRoom.value.map((g) => g.room)).toEqual(['Salon', 'Taras'])
  })

  it('stosuje searchQuery także w widoku po pokojach', () => {
    const { plantsByRoom, searchQuery } = setup(
      [makePlant(1, 'Monstera', 'Salon'), makePlant(2, 'Aloes', 'Salon')],
      ['Salon'],
    )
    searchQuery.value = 'Aloes'
    expect(plantsByRoom.value).toHaveLength(1)
    expect(plantsByRoom.value[0].plants.map((p) => p.name)).toEqual(['Aloes'])
  })

  it('grupuje rośliny razem mimo różnej wielkości liter w nazwie pokoju', () => {
    const { plantsByRoom } = setup(
      [makePlant(1, 'A', 'salon'), makePlant(2, 'B', 'Salon')],
      ['Salon'],
    )
    expect(plantsByRoom.value).toHaveLength(1)
    expect(plantsByRoom.value[0].room).toBe('Salon')
    expect(plantsByRoom.value[0].plants.map((p) => p.name)).toEqual(['A', 'B'])
  })
})
