import { describe, it, expect } from 'vitest'
import { PLANT_TEMPLATES, type PlantTemplate } from '../plantTemplates'
import { SPECIES_CATEGORY_MAP } from '../plantCategories'

const VALID_DIFFICULTIES: PlantTemplate['difficulty'][] = ['łatwa', 'średnia', 'trudna']
const VALID_LIGHTS: PlantTemplate['light'][] = ['cień', 'półcień', 'jasne', 'pełne słońce']

describe('PLANT_TEMPLATES', () => {
  // ─── basic requirements ────────────────────────────────────────────────────

  it('jest niepustą tablicą', () => {
    expect(PLANT_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('każdy szablon ma name', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(t.name, `szablon bez name`).toBeTruthy()
    }
  })

  it('każdy szablon ma species', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(t.species, `${t.name}: brak species`).toBeTruthy()
    }
  })

  it('każdy szablon ma careNotes', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(t.careNotes, `${t.name}: brak careNotes`).toBeTruthy()
    }
  })

  // ─── seasonal data ──────────────────────────────────────────────────────────

  it('wateringByMonth ma 12 wartości nieujemnych', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(t.wateringByMonth, `${t.name}: wateringByMonth`).toHaveLength(12)
      for (const v of t.wateringByMonth) {
        expect(v, `${t.name}: wateringByMonth zawiera ujemną wartość`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('wateringByMonth ma co najmniej jedną niezerową wartość', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(t.wateringByMonth.some((v) => v > 0), `${t.name}: wateringByMonth same zera`).toBe(true)
    }
  })

  it('fertilizingByMonth ma 12 wartości nieujemnych', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(t.fertilizingByMonth, `${t.name}: fertilizingByMonth`).toHaveLength(12)
      for (const v of t.fertilizingByMonth) {
        expect(v, `${t.name}: fertilizingByMonth zawiera ujemną wartość`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  // ─── enum values ──────────────────────────────────────────────────────────

  it('każdy szablon ma poprawne difficulty', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(VALID_DIFFICULTIES, `${t.name}: difficulty="${t.difficulty}"`).toContain(t.difficulty)
    }
  })

  it('każdy szablon ma poprawne light', () => {
    for (const t of PLANT_TEMPLATES) {
      expect(VALID_LIGHTS, `${t.name}: light="${t.light}"`).toContain(t.light)
    }
  })

  // ─── categories ──────────────────────────────────────────────────────────────

  it('każdy szablon ma przypisaną kategorię w SPECIES_CATEGORY_MAP', () => {
    const missing = PLANT_TEMPLATES.filter((t) => !(t.species in SPECIES_CATEGORY_MAP))
    expect(
      missing.map((t) => `${t.name} (${t.species})`),
      'rośliny bez kategorii',
    ).toHaveLength(0)
  })

  // ─── uniqueness ─────────────────────────────────────────────────────────────

  it('nazwy szablonów są unikalne', () => {
    const names = PLANT_TEMPLATES.map((t) => t.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('każdy szablon ma unikalną kombinację name+species', () => {
    const keys = PLANT_TEMPLATES.map((t) => `${t.name}::${t.species}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  // ─── difficulty coverage ─────────────────────────────────────────────────────

  it('są szablony o każdym poziomie trudności', () => {
    const difficulties = new Set(PLANT_TEMPLATES.map((t) => t.difficulty))
    expect(difficulties).toContain('łatwa')
    expect(difficulties).toContain('średnia')
    expect(difficulties).toContain('trudna')
  })

  it('są szablony dla każdego rodzaju oświetlenia', () => {
    const lights = new Set(PLANT_TEMPLATES.map((t) => t.light))
    for (const light of VALID_LIGHTS) {
      expect(lights, `brak szablonu z light="${light}"`).toContain(light)
    }
  })
})
