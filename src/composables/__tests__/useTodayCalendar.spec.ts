import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTodayCalendar } from '../useTodayCalendar'
import { toLocalDateKey } from '../usePlantTasks'

function setup() {
  const doneByDay = ref<Record<string, number>>({})
  const upcomingByDay = ref<Record<number, number>>({})
  const totalTasks = ref(0)
  const calendar = useTodayCalendar({ doneByDay, upcomingByDay, totalTasks })
  return { ...calendar, doneByDay, upcomingByDay, totalTasks }
}

describe('useTodayCalendar — nawigacja dni', () => {
  it('zaczyna z selectedOffset=0 (dziś)', () => {
    const { selectedOffset } = setup()
    expect(selectedOffset.value).toBe(0)
  })

  it('selectDay ustawia wybrany offset', () => {
    const { selectDay, selectedOffset } = setup()
    selectDay(2)
    expect(selectedOffset.value).toBe(2)
  })

  it('goToToday resetuje offset do 0', () => {
    const { selectDay, goToToday, selectedOffset } = setup()
    selectDay(5)
    goToToday()
    expect(selectedOffset.value).toBe(0)
  })

  it('shiftWindow przesuwa okno kalendarza o zadaną deltę', () => {
    const { shiftWindow, calendarDays } = setup()
    const initialFirstOffset = calendarDays.value[0].offset
    shiftWindow(7)
    expect(calendarDays.value[0].offset).toBe(initialFirstOffset + 7)
  })

  it('selectDay przesuwa okno gdy wybrany dzień wypada poza widoczny zakres', () => {
    const { selectDay, calendarDays } = setup()
    selectDay(10)
    const offsets = calendarDays.value.map((d) => d.offset)
    expect(offsets).toContain(10)
  })
})

describe('useTodayCalendar — calendarDays', () => {
  it('zwraca 7 dni wyśrodkowanych na dzisiaj przy starcie', () => {
    const { calendarDays } = setup()
    expect(calendarDays.value).toHaveLength(7)
    expect(calendarDays.value.map((d) => d.offset)).toEqual([-3, -2, -1, 0, 1, 2, 3])
  })

  it('oznacza dzień z offset=0 jako isToday', () => {
    const { calendarDays } = setup()
    const today = calendarDays.value.find((d) => d.offset === 0)
    expect(today?.isToday).toBe(true)
    expect(today?.isPast).toBe(false)
  })

  it('oznacza dni z ujemnym offsetem jako isPast', () => {
    const { calendarDays } = setup()
    const past = calendarDays.value.find((d) => d.offset === -1)
    expect(past?.isPast).toBe(true)
    expect(past?.isToday).toBe(false)
  })

  it('liczba dla dziś pochodzi z totalTasks', () => {
    const { calendarDays, totalTasks } = setup()
    totalTasks.value = 5
    const today = calendarDays.value.find((d) => d.offset === 0)
    expect(today?.count).toBe(5)
  })

  it('liczba dla przyszłych dni pochodzi z upcomingByDay', () => {
    const { calendarDays, upcomingByDay } = setup()
    upcomingByDay.value = { 2: 3 }
    const day = calendarDays.value.find((d) => d.offset === 2)
    expect(day?.count).toBe(3)
  })

  it('liczba dla minionych dni pochodzi z doneByDay wg lokalnego klucza daty', () => {
    const { calendarDays, doneByDay } = setup()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    doneByDay.value = { [toLocalDateKey(yesterday)]: 4 }
    const day = calendarDays.value.find((d) => d.offset === -1)
    expect(day?.count).toBe(4)
  })

  it('brak wpisu w mapie daje count=0', () => {
    const { calendarDays } = setup()
    const day = calendarDays.value.find((d) => d.offset === 3)
    expect(day?.count).toBe(0)
  })
})

describe('useTodayCalendar — selectedDayLabel', () => {
  it('zwraca null gdy wybrany jest dziś (offset=0)', () => {
    const { selectedDayLabel } = setup()
    expect(selectedDayLabel.value).toBeNull()
  })

  it('zwraca sformatowaną etykietę dla innego dnia', () => {
    const { selectDay, selectedDayLabel } = setup()
    selectDay(1)
    expect(selectedDayLabel.value).toEqual(expect.any(String))
    expect(selectedDayLabel.value).not.toBe('')
  })
})

describe('useTodayCalendar — date picker dialog', () => {
  it('openCalendarDialog ustawia pickedDate na aktualnie wybrany dzień i otwiera dialog', () => {
    const { selectDay, openCalendarDialog, pickedDate, calendarDialog } = setup()
    selectDay(2)
    openCalendarDialog()
    expect(calendarDialog.value).toBe(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expected = new Date(today)
    expected.setDate(today.getDate() + 2)
    expect(pickedDate.value?.getTime()).toBe(expected.getTime())
  })

  it('confirmPickedDate ustawia selectedOffset na podstawie pickedDate i zamyka dialog', () => {
    const { openCalendarDialog, pickedDate, confirmPickedDate, selectedOffset, calendarDialog } =
      setup()
    openCalendarDialog()
    const inThreeDays = new Date()
    inThreeDays.setDate(inThreeDays.getDate() + 3)
    pickedDate.value = inThreeDays
    confirmPickedDate()
    expect(selectedOffset.value).toBe(3)
    expect(calendarDialog.value).toBe(false)
  })

  it('confirmPickedDate nic nie robi gdy pickedDate jest null', () => {
    const { confirmPickedDate, selectedOffset, calendarDialog } = setup()
    calendarDialog.value = true
    confirmPickedDate()
    expect(selectedOffset.value).toBe(0)
    expect(calendarDialog.value).toBe(true)
  })
})

describe('useTodayCalendar — etykiety dzisiejszej daty', () => {
  it('todayWeekday i todayDate zwracają niepuste stringi', () => {
    const { todayWeekday, todayDate } = setup()
    expect(todayWeekday.value.length).toBeGreaterThan(0)
    expect(todayDate.value.length).toBeGreaterThan(0)
  })
})
