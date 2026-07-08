import { PLANT_TEMPLATES } from '@/data/plantTemplates'
import { CATEGORY_MAP, SPECIES_CATEGORY_MAP, type PlantCategory } from '@/data/plantCategories'
import type { Plant } from '@/types'

const TEMPLATE_MAP = new Map(PLANT_TEMPLATES.map((t) => [t.species, t]))

export function getTemplateForPlant(plant: Plant) {
  if (!plant.templateSpecies) return undefined
  return TEMPLATE_MAP.get(plant.templateSpecies)
}

/**
 * Returns the current watering interval for a plant (in days).
 * - If the plant has a template: uses wateringByMonth[currentMonth]
 * - 0 means "skip this month" (dormancy) → returns null
 * - Fallback: the plant's wateringIntervalDays, then default 7
 */
export function getWateringInterval(plant: Plant, month = new Date().getMonth()): number | null {
  const template = getTemplateForPlant(plant)
  if (template) {
    const interval = template.wateringByMonth[month]
    return interval === 0 ? null : interval
  }
  return plant.wateringIntervalDays ?? 7
}

/**
 * Returns the current fertilizing interval for a plant (in days).
 * 0 or no template without fertilizingIntervalDays → null (don't fertilize)
 */
export function getFertilizingInterval(plant: Plant, month = new Date().getMonth()): number | null {
  const template = getTemplateForPlant(plant)
  if (template) {
    const interval = template.fertilizingByMonth[month]
    return interval === 0 ? null : interval
  }
  return plant.fertilizingIntervalDays ?? null
}

/**
 * Returns the current misting interval for a plant (in days).
 * 0 or no template without mistingIntervalDays → null (don't mist)
 */
export function getMistingInterval(plant: Plant, month = new Date().getMonth()): number | null {
  const template = getTemplateForPlant(plant)
  if (template) {
    const interval = template.mistingByMonth[month]
    return interval === 0 ? null : interval
  }
  return plant.mistingIntervalDays ?? null
}

export function getCleaningInterval(plant: Plant): number | null {
  const template = getTemplateForPlant(plant)
  if (template) return template.cleaningIntervalDays ?? null
  return plant.cleaningIntervalDays ?? null
}

/**
 * Returns the list of plants that should be repotted in the given month.
 */
export function getPlantsToRepot(plants: Plant[], month = new Date().getMonth()): Plant[] {
  // months in the template are 1-indexed (1=January), getMonth() returns 0-indexed
  const monthNumber = month + 1
  return plants.filter((plant) => {
    const template = getTemplateForPlant(plant)
    return template?.repottingMonths.includes(monthNumber)
  })
}

/** Returns the plant's category based on its template. */
export function getCategoryForPlant(plant: Plant): PlantCategory | undefined {
  const template = getTemplateForPlant(plant)
  if (!template) return undefined
  const categoryId = SPECIES_CATEGORY_MAP[template.species] ?? 'other'
  return CATEGORY_MAP.get(categoryId)
}

/** Difference in full months between two dates. */
export function monthsDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}


/**
 * Returns the list of plants that should be pruned in the given month.
 */
export function getPlantsToPrune(plants: Plant[], month = new Date().getMonth()): Plant[] {
  const monthNumber = month + 1
  return plants.filter((plant) => {
    const template = getTemplateForPlant(plant)
    return template?.pruningMonths.includes(monthNumber)
  })
}
