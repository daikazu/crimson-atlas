import type { FoundMap } from '../state/selectors'

/**
 * Accepts any of:
 * - MapGenie `user.locations`: {"123456": true, ...}
 * - the whole MapGenie `user` object: {"locations": {...}, ...}
 * - a plain array of ids
 * - this app's backup: {"found": [ids]}
 * Returns sorted, de-duplicated location ids.
 */
export function parseProgress(text: string): number[] {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('That is not valid JSON.')
  }

  const ids = extractIds(json)
  if (ids === null) throw new Error('No location ids found in that JSON.')
  return [...new Set(ids)].sort((a, b) => a - b)
}

function extractIds(json: unknown): number[] | null {
  if (Array.isArray(json)) return json.map(Number).filter(Number.isInteger)
  if (!json || typeof json !== 'object') return null

  const obj = json as Record<string, unknown>
  if (Array.isArray(obj.found)) return extractIds(obj.found)
  if (obj.locations && typeof obj.locations === 'object') return extractIds(obj.locations)

  const entries = Object.entries(obj)
  if (entries.length === 0 || !entries.every(([k, v]) => /^\d+$/.test(k) && typeof v === 'boolean')) return null
  return entries.filter(([, v]) => v).map(([k]) => Number(k))
}

export function exportProgress(found: FoundMap): string {
  const ids = Object.keys(found).map(Number).sort((a, b) => a - b)
  return JSON.stringify({ app: 'crimson-desert-map', exportedAt: new Date().toISOString(), found: ids }, null, 2)
}
