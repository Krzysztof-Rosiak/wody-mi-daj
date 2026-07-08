import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRoomsStore, DEFAULT_ROOMS } from '../rooms'
import { db } from '@/db'

describe('useRoomsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.customRooms.clear()
  })

  // ─── allRooms ───────────────────────────────────────────────────────────────

  it('allRooms zawiera domyślne pokoje bez fetchAll', () => {
    const store = useRoomsStore()
    for (const room of DEFAULT_ROOMS) {
      expect(store.allRooms).toContain(room)
    }
  })

  it('allRooms zawiera dokładnie domyślne pokoje gdy brak własnych', async () => {
    const store = useRoomsStore()
    await store.fetchAll()
    expect(store.allRooms).toHaveLength(DEFAULT_ROOMS.length)
  })

  it('allRooms zawiera własne pokoje po dodaniu', async () => {
    const store = useRoomsStore()
    await store.add('Piwnica')
    expect(store.allRooms).toContain('Piwnica')
  })

  it('allRooms zachowuje kolejność: domyślne przed własnymi', async () => {
    const store = useRoomsStore()
    await store.add('Altanka')
    const defaultEnd = DEFAULT_ROOMS.length - 1
    expect(store.allRooms[0]).toBe(DEFAULT_ROOMS[0])
    expect(store.allRooms[defaultEnd]).toBe(DEFAULT_ROOMS[defaultEnd])
    expect(store.allRooms).toContain('Altanka')
  })

  // ─── add ────────────────────────────────────────────────────────────────────

  it('add zapisuje nowy pokój w bazie', async () => {
    const store = useRoomsStore()
    await store.add('Garaż')
    const all = await db.customRooms.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('Garaż')
  })

  it('add przycina białe znaki', async () => {
    const store = useRoomsStore()
    await store.add('  Taras  ')
    expect(store.customRooms[0].name).toBe('Taras')
  })

  it('add ignoruje pustą nazwę', async () => {
    const store = useRoomsStore()
    await store.add('   ')
    expect(store.customRooms).toHaveLength(0)
  })

  it('add nie dodaje duplikatu (case-insensitive)', async () => {
    const store = useRoomsStore()
    await store.add('Piwnica')
    await store.add('piwnica')
    await store.add('PIWNICA')
    expect(store.customRooms).toHaveLength(1)
  })

  it('add nie dodaje nazwy już istniejącej w domyślnych', async () => {
    const store = useRoomsStore()
    await store.add('Salon')
    expect(store.customRooms).toHaveLength(0)
  })

  it('add zwraca void i odświeża listę', async () => {
    const store = useRoomsStore()
    expect(store.customRooms).toHaveLength(0)
    await store.add('Strych')
    expect(store.customRooms).toHaveLength(1)
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  it('remove usuwa pokój z bazy', async () => {
    const store = useRoomsStore()
    await store.add('Kotłownia')
    const id = store.customRooms[0].id as number
    await store.remove(id)
    expect(store.customRooms).toHaveLength(0)
    const db_rooms = await db.customRooms.toArray()
    expect(db_rooms).toHaveLength(0)
  })

  it('remove usuwa tylko wskazany pokój', async () => {
    const store = useRoomsStore()
    await store.add('Pokój A')
    await store.add('Pokój B')
    const idA = store.customRooms.find((r) => r.name === 'Pokój A')?.id as number
    await store.remove(idA)
    expect(store.customRooms).toHaveLength(1)
    expect(store.customRooms[0].name).toBe('Pokój B')
  })

  // ─── fetchAll ───────────────────────────────────────────────────────────────

  it('fetchAll wczytuje pokoje z bazy', async () => {
    await db.customRooms.bulkAdd([{ name: 'Sala' }, { name: 'Weranda' }])
    const store = useRoomsStore()
    await store.fetchAll()
    expect(store.customRooms).toHaveLength(2)
  })

  it('fetchAll sortuje pokoje alfabetycznie', async () => {
    await db.customRooms.bulkAdd([{ name: 'Weranda' }, { name: 'Atelier' }])
    const store = useRoomsStore()
    await store.fetchAll()
    expect(store.customRooms[0].name).toBe('Atelier')
    expect(store.customRooms[1].name).toBe('Weranda')
  })
})
