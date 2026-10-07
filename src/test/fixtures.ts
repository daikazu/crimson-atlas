import type { Category, Group, Location, Region } from '../data/types'

export const groups: Group[] = [
  { id: 1, title: 'Strongholds', color: '8A867B', categoryIds: [10] },
  { id: 2, title: 'Items', color: '5D5285', categoryIds: [20, 21] },
]

export const categories: Category[] = [
  { id: 10, groupId: 1, title: 'Stronghold', icon: 'stronghold', info: null, count: 1 },
  { id: 20, groupId: 2, title: 'Armor', icon: 'armor', info: null, count: 2 },
  { id: 21, groupId: 2, title: 'Chest', icon: 'chest', info: null, count: 1 },
]

export const regions: Region[] = [
  { id: 4, title: 'Hernand' },
  { id: 5, title: 'Pailune' },
]

const loc = (id: number, categoryId: number, regionId: number | null, title: string, description: string | null = null): Location => ({
  id,
  categoryId,
  regionId,
  title,
  description,
  lat: 0.5,
  lng: -0.5,
  media: [],
})

export const locations: Location[] = [
  loc(100, 10, 4, 'Hernand Castle', 'The seat of the **Hernand** lords'),
  loc(101, 20, 4, 'Iron Plate Armor', 'Found in a chest under the bridge'),
  loc(102, 20, 5, 'Frost Helm'),
  loc(103, 21, null, 'Treasure Chest', 'Behind the waterfall'),
]
