import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/db'
import type { CustomRoom } from '@/types'

export const DEFAULT_ROOMS = [
  'Salon',
  'Kuchnia',
  'Sypialnia',
  'Łazienka',
  'Przedpokój',
  'Gabinet',
  'Balkon',
  'Inne',
] as const

async function loadRoomPrefs() {
  const row = await db.settings.get(1)
  return {
    hidden: new Set<string>(row?.hiddenRooms ?? []),
    order: row?.roomOrder ?? [],
  }
}

async function saveHidden(set: Set<string>) {
  await db.settings.update(1, { hiddenRooms: [...set] })
}

async function saveOrder(order: string[]) {
  await db.settings.update(1, { roomOrder: order })
}

export const useRoomsStore = defineStore('rooms', () => {
  const customRooms = ref<CustomRoom[]>([])
  const hiddenDefaults = ref<Set<string>>(new Set())
  const roomOrder = ref<string[]>([])
  const selectedRoom = ref<string | null>(null)
  const viewMode = ref<'list' | 'rooms'>('list')

  async function fetchAll() {
    customRooms.value = await db.customRooms.orderBy('name').toArray()
    const prefs = await loadRoomPrefs()
    hiddenDefaults.value = prefs.hidden
    roomOrder.value = prefs.order
  }

  async function add(name: string): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return
    const exists = allRooms.value.some(
      (r) => r.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) return
    await db.customRooms.add({ name: trimmed })
    await fetchAll()
  }

  async function rename(id: number, name: string): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.customRooms.update(id, { name: trimmed })
    await fetchAll()
  }

  async function remove(id: number): Promise<void> {
    await db.customRooms.delete(id)
    customRooms.value = customRooms.value.filter((r) => r.id !== id)
  }

  async function hideDefault(name: string) {
    hiddenDefaults.value.add(name)
    await saveHidden(hiddenDefaults.value)
  }

  async function restoreDefault(name: string) {
    hiddenDefaults.value.delete(name)
    await saveHidden(hiddenDefaults.value)
  }

  async function reorder(ordered: string[]) {
    roomOrder.value = ordered
    await saveOrder(ordered)
  }

  const allRooms = computed<string[]>(() => {
    const visible = [
      ...DEFAULT_ROOMS.filter((r) => !hiddenDefaults.value.has(r)),
      ...customRooms.value.map((r) => r.name),
    ]
    if (!roomOrder.value.length) return visible

    const orderMap = new Map(roomOrder.value.map((name, i) => [name, i]))
    return [...visible].sort((a, b) => {
      const ia = orderMap.get(a) ?? 999
      const ib = orderMap.get(b) ?? 999
      return ia - ib
    })
  })

  return {
    customRooms,
    hiddenDefaults,
    roomOrder,
    selectedRoom,
    viewMode,
    allRooms,
    fetchAll,
    add,
    rename,
    remove,
    hideDefault,
    restoreDefault,
    reorder,
  }
})
