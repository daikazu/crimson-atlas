import type { FilterSpecification } from 'maplibre-gl'
import type { Category, Location } from '../data/types'
import type { FoundMap } from '../state/selectors'

export interface MarkerProps {
  /** category id */
  c: number
  /** region id, -1 when unknown */
  r: number
  /** 1 when found */
  f: 0 | 1
  icon: string
}

export interface MarkerCollection {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    id: number
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: MarkerProps
  }[]
}

export function toFeatureCollection(locations: Location[], categories: Category[], found: FoundMap): MarkerCollection {
  const iconById = new Map(categories.map((c) => [c.id, c.icon]))
  return {
    type: 'FeatureCollection',
    features: locations.map((l) => ({
      type: 'Feature',
      id: l.id,
      geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
      properties: { c: l.categoryId, r: l.regionId ?? -1, f: found[l.id] ? 1 : 0, icon: iconById.get(l.categoryId) ?? '' },
    })),
  }
}

export interface MarkerFilterState {
  hiddenCategoryIds: number[]
  regionId: number | null
  hideFound: boolean
  /** A location shown regardless of filters (e.g. picked from search). */
  revealedId: number | null
}

export function buildMarkerFilter(s: MarkerFilterState): FilterSpecification {
  const clauses: unknown[] = [['!', ['in', ['get', 'c'], ['literal', s.hiddenCategoryIds]]]]
  if (s.regionId !== null) clauses.push(['==', ['get', 'r'], s.regionId])
  if (s.hideFound) clauses.push(['==', ['get', 'f'], 0])
  const base = ['all', ...clauses]
  return (s.revealedId === null ? base : ['any', ['==', ['id'], s.revealedId], base]) as FilterSpecification
}
