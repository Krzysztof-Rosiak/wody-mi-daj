import { defineStore } from 'pinia'
import { db } from '@/db'
import type { Snooze, SnoozedCareType } from '@/types'

export const useSnoozesStore = defineStore('snoozes', () => {
  async function snooze(plantId: number, careType: SnoozedCareType, until: Date) {
    await db.snoozes.where({ plantId, careType }).delete()
    await db.snoozes.add({ plantId, careType, until })
  }

  async function clear(plantId: number, careType: SnoozedCareType) {
    await db.snoozes.where({ plantId, careType }).delete()
  }

  async function getAll(): Promise<Snooze[]> {
    return db.snoozes.toArray()
  }

  return { snooze, clear, getAll }
})
