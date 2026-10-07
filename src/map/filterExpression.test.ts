import { describe, expect, it } from 'vitest'
import { buildMarkerFilter, toFeatureCollection } from './filterExpression'
import { categories, locations } from '../test/fixtures'

describe('toFeatureCollection', () => {
  it('builds point features with category, region, found, and icon properties', () => {
    const fc = toFeatureCollection(locations, categories, { 102: true })
    expect(fc.features).toHaveLength(4)
    expect(fc.features[2]).toEqual({
      type: 'Feature',
      id: 102,
      geometry: { type: 'Point', coordinates: [-0.5, 0.5] },
      properties: { c: 20, r: 5, f: 1, icon: 'armor' },
    })
    expect(fc.features[3].properties).toMatchObject({ r: -1, f: 0 })
  })
})

describe('buildMarkerFilter', () => {
  it('hides hidden categories', () => {
    expect(buildMarkerFilter({ hiddenCategoryIds: [20, 21], regionId: null, hideFound: false, revealedId: null })).toEqual([
      'all',
      ['!', ['in', ['get', 'c'], ['literal', [20, 21]]]],
    ])
  })

  it('adds region and found clauses, and always shows the revealed location', () => {
    expect(buildMarkerFilter({ hiddenCategoryIds: [], regionId: 4, hideFound: true, revealedId: 102 })).toEqual([
      'any',
      ['==', ['id'], 102],
      ['all', ['!', ['in', ['get', 'c'], ['literal', []]]], ['==', ['get', 'r'], 4], ['==', ['get', 'f'], 0]],
    ])
  })
})
