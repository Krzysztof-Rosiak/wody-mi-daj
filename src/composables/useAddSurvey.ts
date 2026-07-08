import { useSurveysStore } from '@/stores/surveys'
import { usePlantsStore } from '@/stores/plants'
import type { PlantSurvey } from '@/types'

export function useAddSurvey() {
  const surveysStore = useSurveysStore()
  const plantsStore = usePlantsStore()

  async function addSurvey(survey: Omit<PlantSurvey, 'id'>): Promise<number> {
    const id = await surveysStore.add(survey)
    if (survey.imageBase64) {
      const plant = plantsStore.getById(survey.plantId)
      if (plant && !plant.imageBase64)
        await plantsStore.update(survey.plantId, { imageBase64: survey.imageBase64 })
    }
    return id
  }

  return { addSurvey }
}
