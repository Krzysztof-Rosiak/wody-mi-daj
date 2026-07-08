import { describe, it, expect } from 'vitest'
import { sortByRoom, groupByRoom } from '../groupByRoom'

type Item = { plant: { room: string } }

const item = (room: string): Item => ({ plant: { room } })

describe('sortByRoom', () => {
  it('sortuje według kolejności podanej w roomOrder', () => {
    const items = [item('Kuchnia'), item('Salon'), item('Sypialnia')]
    const result = sortByRoom(items, ['Sypialnia', 'Salon', 'Kuchnia'])
    expect(result.map((i) => i.plant.room)).toEqual(['Sypialnia', 'Salon', 'Kuchnia'])
  })

  it('umieszcza pokoje spoza roomOrder na końcu, posortowane alfabetycznie', () => {
    const items = [item('Zzz'), item('Salon'), item('Aaa')]
    const result = sortByRoom(items, ['Salon'])
    expect(result.map((i) => i.plant.room)).toEqual(['Salon', 'Aaa', 'Zzz'])
  })

  it('bez roomOrder sortuje wszystko alfabetycznie', () => {
    const items = [item('Zzz'), item('Aaa'), item('Mmm')]
    const result = sortByRoom(items)
    expect(result.map((i) => i.plant.room)).toEqual(['Aaa', 'Mmm', 'Zzz'])
  })

  it('nie mutuje oryginalnej tablicy', () => {
    const items = [item('B'), item('A')]
    const result = sortByRoom(items, [])
    expect(result).not.toBe(items)
    expect(items.map((i) => i.plant.room)).toEqual(['B', 'A'])
  })
})

describe('groupByRoom', () => {
  it('grupuje elementy z tego samego pokoju razem', () => {
    const items = [item('Salon'), item('Kuchnia'), item('Salon')]
    const groups = groupByRoom(items, ['Salon', 'Kuchnia'])
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ room: 'Salon' })
    expect(groups[0].items).toHaveLength(2)
    expect(groups[1]).toMatchObject({ room: 'Kuchnia' })
    expect(groups[1].items).toHaveLength(1)
  })

  it('zwraca pustą tablicę grup dla pustej listy elementów', () => {
    expect(groupByRoom([], ['Salon'])).toEqual([])
  })

  it('zachowuje kolejność z roomOrder przy grupowaniu', () => {
    const items = [item('Kuchnia'), item('Salon')]
    const groups = groupByRoom(items, ['Salon', 'Kuchnia'])
    expect(groups.map((g) => g.room)).toEqual(['Salon', 'Kuchnia'])
  })
})
