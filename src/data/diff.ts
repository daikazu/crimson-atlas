import type { MapData } from './types'

export interface UpdateSummary {
  /** No data existed before this download. */
  first: boolean
  added: number
  removed: number
  /** Anything differs — new/removed locations or edited details. */
  changed: boolean
  total: number
}

export function summarizeUpdate(previous: MapData | null, next: MapData): UpdateSummary {
  const total = next.locations.length
  if (!previous) return { first: true, added: total, removed: 0, changed: true, total }

  const before = new Set(previous.locations.map((l) => l.id))
  const after = new Set(next.locations.map((l) => l.id))
  const added = next.locations.filter((l) => !before.has(l.id)).length
  const removed = previous.locations.filter((l) => !after.has(l.id)).length
  const { syncedAt: _a, ...prevContent } = previous
  const { syncedAt: _b, ...nextContent } = next
  const changed = added > 0 || removed > 0 || JSON.stringify(prevContent) !== JSON.stringify(nextContent)
  return { first: false, added, removed, changed, total }
}
