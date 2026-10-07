import { describe, expect, it } from 'vitest'
import { summarizeUpdate } from './diff'
import type { MapData } from './types'
import { locations } from '../test/fixtures'

const mapData = (locs = locations): MapData =>
  ({ syncedAt: '', groups: [], categories: [], regions: [], locations: locs, config: {} }) as unknown as MapData

describe('summarizeUpdate', () => {
  it('reports a first download', () => {
    expect(summarizeUpdate(null, mapData())).toEqual({ first: true, added: 4, removed: 0, changed: true, total: 4 })
  })

  it('counts added and removed locations', () => {
    const next = mapData([...locations.slice(1), { ...locations[0], id: 999 }, { ...locations[0], id: 998 }])
    expect(summarizeUpdate(mapData(), next)).toEqual({ first: false, added: 2, removed: 1, changed: true, total: 5 })
  })

  it('flags edited details even when no locations were added or removed', () => {
    const next = mapData([{ ...locations[0], description: 'New notes' }, ...locations.slice(1)])
    expect(summarizeUpdate(mapData(), next)).toEqual({ first: false, added: 0, removed: 0, changed: true, total: 4 })
  })

  it('reports no change for identical data', () => {
    expect(summarizeUpdate(mapData(), mapData()).changed).toBe(false)
  })
})
