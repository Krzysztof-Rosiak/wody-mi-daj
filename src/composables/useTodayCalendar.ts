import { computed, ref, type Ref } from 'vue'
import { toLocalDateKey } from '@/composables/usePlantTasks'
import { formatDatePl } from '@/utils/date'
import type { CalendarDay } from '@/components/care/CalendarStrip.vue'

export function useTodayCalendar(deps: {
  doneByDay: Ref<Record<string, number>>
  upcomingByDay: Ref<Record<number, number>>
  totalTasks: Ref<number>
}) {
  const selectedOffset = ref(0)
  const windowOffset = ref(0)
  const calendarDialog = ref(false)
  const pickedDate = ref<Date | null>(null)

  function selectDay(offset: number) {
    selectedOffset.value = offset
    const rel = offset - windowOffset.value
    if (rel < -3) windowOffset.value = offset + 3
    else if (rel > 3) windowOffset.value = offset - 3
  }

  function shiftWindow(delta: number) {
    windowOffset.value += delta
  }

  function goToToday() {
    selectedOffset.value = 0
    windowOffset.value = 0
  }

  function openCalendarDialog() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(today)
    target.setDate(today.getDate() + selectedOffset.value)
    pickedDate.value = target
    calendarDialog.value = true
  }

  function confirmPickedDate() {
    if (!pickedDate.value) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const picked = new Date(pickedDate.value)
    picked.setHours(0, 0, 0, 0)
    selectedOffset.value = Math.round((picked.getTime() - today.getTime()) / 86_400_000)
    calendarDialog.value = false
  }

  const selectedDayLabel = computed(() => {
    if (selectedOffset.value === 0) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(today)
    target.setDate(today.getDate() + selectedOffset.value)
    return formatDatePl(target, { weekday: 'long', day: 'numeric', month: 'long' })
  })

  const calendarDays = computed<CalendarDay[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const offset = windowOffset.value - 3 + i
      const date = new Date(today)
      date.setDate(today.getDate() + offset)
      const isToday = offset === 0
      const isPast = offset < 0
      let count: number
      if (isPast) {
        const key = toLocalDateKey(date)
        count = deps.doneByDay.value[key] ?? 0
      } else if (isToday) {
        count = deps.totalTasks.value
      } else {
        count = deps.upcomingByDay.value[offset] ?? 0
      }
      return { date, offset, isToday, isPast, count }
    })
  })

  const todayWeekday = computed(() => formatDatePl(new Date(), { weekday: 'long' }))
  const todayDate = computed(() => formatDatePl(new Date(), { day: 'numeric', month: 'long' }))

  return {
    selectedOffset,
    calendarDialog,
    pickedDate,
    selectDay,
    shiftWindow,
    goToToday,
    openCalendarDialog,
    confirmPickedDate,
    selectedDayLabel,
    calendarDays,
    todayWeekday,
    todayDate,
  }
}
