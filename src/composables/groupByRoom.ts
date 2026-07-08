export function sortByRoom<T extends { plant: { room: string } }>(
  items: T[],
  roomOrder: string[] = [],
): T[] {
  const roomIndex = (room: string) => {
    const i = roomOrder.indexOf(room)
    return i === -1 ? roomOrder.length : i
  }

  return [...items].sort((a, b) => {
    const diff = roomIndex(a.plant.room) - roomIndex(b.plant.room)
    return diff !== 0 ? diff : a.plant.room.localeCompare(b.plant.room, 'pl')
  })
}

export function groupByRoom<T extends { plant: { room: string } }>(
  items: T[],
  roomOrder: string[] = [],
): { room: string; items: T[] }[] {
  const sorted = sortByRoom(items, roomOrder)

  const groups: { room: string; items: T[] }[] = []
  for (const item of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.room === item.plant.room) last.items.push(item)
    else groups.push({ room: item.plant.room, items: [item] })
  }
  return groups
}
