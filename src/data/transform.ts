import type { Category, Group, Location, MapConfig, MapData, Region } from './types'

const TILES_BASE = 'https://tiles.mapgenie.io/games/'

/* Minimal shapes of MapGenie's raw payloads — only the fields we read. */
interface RawCategory {
  id: number
  group_id: number
  title: string
  icon: string
  info: string | null
  order: number
  locations_count: number
}
interface RawGroup {
  id: number
  title: string
  color: string
  order: number
  categories: RawCategory[]
}
interface RawTileSet {
  pattern: string
  order: number
  min_zoom: number
  max_zoom: number
  tiles_max_zoom: number
}
export interface RawEmbedded {
  groups: RawGroup[]
  mapConfig: { tile_sets: RawTileSet[]; initial_zoom: number; start_lat: number; start_lng: number }
}
interface RawLocation {
  id: number
  category_id: number
  region_id: number | null
  title: string
  description: string | null
  latitude: string
  longitude: string
  media: { url: string; title: string; type: string; order: number }[] | null
}
export interface RawApiData {
  regions: { id: number; title: string; order: number }[]
  styles: { mapStyle: { bounds: number[] } }
  locations: RawLocation[]
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order

/** Pulls the `window.mapData = {...}` object literal out of a MapGenie map page. */
export function extractEmbeddedMapData(html: string): RawEmbedded {
  const marker = html.indexOf('window.mapData')
  if (marker === -1) throw new Error('window.mapData not found in page HTML')
  const start = html.indexOf('{', marker)
  // Walk the object literal, respecting strings, to find its matching close brace.
  let depth = 0
  let inString = false
  for (let i = start; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
    } else if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1))
  }
  throw new Error('window.mapData object is not terminated')
}

export function transformMapData(api: RawApiData, embedded: RawEmbedded, syncedAt: string): MapData {
  const rawGroups = [...embedded.groups].sort(byOrder)

  const groups: Group[] = []
  const categories: Category[] = []
  for (const g of rawGroups) {
    const cats = [...g.categories].sort(byOrder)
    groups.push({ id: g.id, title: g.title, color: g.color, categoryIds: cats.map((c) => c.id) })
    for (const c of cats) {
      categories.push({ id: c.id, groupId: c.group_id, title: c.title, icon: c.icon, info: c.info, count: c.locations_count })
    }
  }

  const regions: Region[] = [...api.regions].sort(byOrder).map((r) => ({ id: r.id, title: r.title }))

  const locations: Location[] = api.locations.map((l) => ({
    id: l.id,
    categoryId: l.category_id,
    regionId: l.region_id,
    title: l.title,
    description: l.description,
    lat: Number(l.latitude),
    lng: Number(l.longitude),
    media: (l.media ?? [])
      .filter((m) => m.type === 'image')
      .sort(byOrder)
      .map((m) => ({ url: m.url, title: m.title })),
  }))

  const tileSet = [...embedded.mapConfig.tile_sets].sort(byOrder)[0]
  const [w, s, e, n] = api.styles.mapStyle.bounds
  const config: MapConfig = {
    tileUrl: TILES_BASE + tileSet.pattern,
    minZoom: tileSet.min_zoom,
    maxZoom: tileSet.max_zoom,
    tilesMaxZoom: tileSet.tiles_max_zoom,
    initialZoom: embedded.mapConfig.initial_zoom,
    center: [embedded.mapConfig.start_lng, embedded.mapConfig.start_lat],
    bounds: [w, s, e, n],
  }

  return { syncedAt, groups, categories, regions, locations, config }
}
