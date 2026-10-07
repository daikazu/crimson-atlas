import { describe, expect, it } from 'vitest'
import { computeProgress, formatPercent } from './selectors'
import { groups, locations } from '../test/fixtures'

describe('computeProgress', () => {
  it('counts found and total per category, group, and overall', () => {
    const p = computeProgress(locations, groups, { 101: true, 103: true }, null)
    expect(p.overall).toEqual({ found: 2, total: 4 })
    expect(p.byCategory.get(20)).toEqual({ found: 1, total: 2 })
    expect(p.byCategory.get(21)).toEqual({ found: 1, total: 1 })
    expect(p.byCategory.get(10)).toEqual({ found: 0, total: 1 })
    expect(p.byGroup.get(2)).toEqual({ found: 2, total: 3 })
    expect(p.byGroup.get(1)).toEqual({ found: 0, total: 1 })
  })

  it('limits counts to the selected region', () => {
    const p = computeProgress(locations, groups, { 101: true, 102: true }, 4)
    expect(p.overall).toEqual({ found: 1, total: 2 })
    expect(p.byCategory.get(20)).toEqual({ found: 1, total: 1 })
    expect(p.byCategory.get(21)).toEqual({ found: 0, total: 0 })
  })

  it('ignores found ids that are not locations', () => {
    const p = computeProgress(locations, groups, { 999: true }, null)
    expect(p.overall).toEqual({ found: 0, total: 4 })
  })
})

describe('formatPercent', () => {
  it('shows one decimal below 10% and whole numbers above', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(0.18)).toBe('0.2%')
    expect(formatPercent(42.6)).toBe('43%')
  })
})
