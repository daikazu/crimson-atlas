export interface Group {
  id: number
  title: string
  color: string
  categoryIds: number[]
}

export interface Category {
  id: number
  groupId: number
  title: string
  icon: string
  info: string | null
  count: number
}

export interface Region {
  id: number
  title: string
}

export interface Media {
  url: string
  title: string
}

export interface Location {
  id: number
  categoryId: number
  regionId: number | null
  title: string
  description: string | null
  lat: number
  lng: number
  media: Media[]
}

export interface MapConfig {
  tileUrl: string
  minZoom: number
  maxZoom: number
  tilesMaxZoom: number
  initialZoom: number
  center: [lng: number, lat: number]
  /** [west, south, east, north] */
  bounds: [number, number, number, number]
}

export interface MapData {
  syncedAt: string
  groups: Group[]
  categories: Category[]
  regions: Region[]
  locations: Location[]
  config: MapConfig
}
