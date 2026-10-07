import type { Group, Location } from '../data/types'

export interface Progress {
  found: number
  total: number
}

export interface ProgressSummary {
  overall: Progress
  byCategory: Map<number, Progress>
  byGroup: Map<number, Progress>
}

export type FoundMap = Record<number, true>

/** Found/total counts per category, per group, and overall, optionally limited to one region. */
export function computeProgress(locations: Location[], groups: Group[], found: FoundMap, regionId: number | null): ProgressSummary {
  const byCategory = new Map<number, Progress>()
  for (const g of groups) for (const id of g.categoryIds) byCategory.set(id, { found: 0, total: 0 })

  const overall = { found: 0, total: 0 }
  for (const l of locations) {
    if (regionId !== null && l.regionId !== regionId) continue
    const p = byCategory.get(l.categoryId)
    if (!p) continue
    const isFound = found[l.id] === true
    p.total++
    overall.total++
    if (isFound) {
      p.found++
      overall.found++
    }
  }

  const byGroup = new Map<number, Progress>()
  for (const g of groups) {
    const sum = { found: 0, total: 0 }
    for (const id of g.categoryIds) {
      const p = byCategory.get(id)!
      sum.found += p.found
      sum.total += p.total
    }
    byGroup.set(g.id, sum)
  }

  return { overall, byCategory, byGroup }
}

export const percent = (p: Progress) => (p.total === 0 ? 0 : (p.found / p.total) * 100)

/** One decimal below 10% so early progress is visible; whole numbers above. */
export const formatPercent = (pct: number) => `${pct > 0 && pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`
