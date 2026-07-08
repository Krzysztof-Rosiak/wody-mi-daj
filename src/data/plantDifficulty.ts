import type { PlantTemplate } from './plantTemplates'

export const DIFFICULTY_COLOR_MAP: Record<PlantTemplate['difficulty'], string> = {
  łatwa: 'var(--accent-deep)',
  średnia: 'var(--cond-2)',
  trudna: 'var(--warn)',
}

export const DIFFICULTY_BG_MAP: Record<PlantTemplate['difficulty'], string> = {
  łatwa: 'var(--accent-soft)',
  średnia: 'var(--cond-2-soft)',
  trudna: 'var(--warn-soft)',
}
