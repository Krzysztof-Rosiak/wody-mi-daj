export function formatDatePl(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('pl-PL', options)
}

export function toISODateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
