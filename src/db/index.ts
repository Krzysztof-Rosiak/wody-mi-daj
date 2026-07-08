import Dexie, { type Table } from 'dexie'
import type { Plant, CareEvent, CustomRoom, Snooze, PlantSurvey, AppSettings, RepottingDismissal, PlantPhoto } from '@/types'

export interface TemplateImageCache {
  species: string
  imageUrl: string | null
  fetchedAt: number
}

export class PlantsDatabase extends Dexie {
  plants!: Table<Plant>
  careEvents!: Table<CareEvent>
  customRooms!: Table<CustomRoom>
  snoozes!: Table<Snooze>
  plantSurveys!: Table<PlantSurvey>
  settings!: Table<AppSettings>
  templateImageCache!: Table<TemplateImageCache>
  repottingDismissals!: Table<RepottingDismissal>
  plantPhotos!: Table<PlantPhoto>

  constructor() {
    super('plantsDb')
    this.version(1).stores({
      plants: '++id, room, createdAt, archivedAt',
      careEvents: '++id, plantId, type, date',
      customRooms: '++id, name',
      snoozes: '++id, plantId, careType',
      plantSurveys: '++id, plantId, date',
      settings: 'id',
      templateImageCache: 'species',
    })
    this.version(2).stores({
      snoozes: '++id, plantId, careType, [plantId+careType]',
    })
    this.version(3).stores({
      repottingDismissals: '++id, plantId',
    })
    this.version(4).stores({
      plantPhotos: '++id, plantId, createdAt',
    })
  }
}

export const db = new PlantsDatabase()
