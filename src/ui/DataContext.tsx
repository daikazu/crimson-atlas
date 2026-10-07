import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Category, Group, Location, MapData, Region } from '../data/types'
import type { Sprite } from '../data/useMapData'
import { createSearch } from '../search/searchIndex'

export interface DataContextValue {
  data: MapData
  sprite: Sprite
  spriteSize: { w: number; h: number }
  categoryById: Map<number, Category>
  groupById: Map<number, Group>
  regionById: Map<number, Region>
  locationById: Map<number, Location>
  allCategoryIds: number[]
  search: (query: string, limit?: number) => number[]
}

const Ctx = createContext<DataContextValue | null>(null)

export function DataProvider({ data, sprite, children }: { data: MapData; sprite: Sprite; children: ReactNode }) {
  const value = useMemo<DataContextValue>(
    () => ({
      data,
      sprite,
      spriteSize: {
        w: Math.max(...Object.values(sprite).map((e) => e.x + e.width)),
        h: Math.max(...Object.values(sprite).map((e) => e.y + e.height)),
      },
      categoryById: new Map(data.categories.map((c) => [c.id, c])),
      groupById: new Map(data.groups.map((g) => [g.id, g])),
      regionById: new Map(data.regions.map((r) => [r.id, r])),
      locationById: new Map(data.locations.map((l) => [l.id, l])),
      allCategoryIds: data.categories.map((c) => c.id),
      search: createSearch(data.locations, data.categories),
    }),
    [data, sprite],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData must be used inside <DataProvider>')
  return v
}
