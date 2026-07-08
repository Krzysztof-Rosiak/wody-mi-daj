import { defineStore } from 'pinia'
import { db } from '@/db'
import type { RepottingDismissal } from '@/types'

export const useRepottingDismissalsStore = defineStore('repottingDismissals', () => {
  async function dismiss(plantId: number) {
    await db.repottingDismissals.where('plantId').equals(plantId).delete()
    const dismissedUntilYear = new Date().getFullYear() + 1
    await db.repottingDismissals.add({ plantId, dismissedUntilYear })
  }

  async function clear(plantId: number) {
    await db.repottingDismissals.where('plantId').equals(plantId).delete()
  }

  async function getAll(): Promise<RepottingDismissal[]> {
    return db.repottingDismissals.toArray()
  }

  return { dismiss, clear, getAll }
})
