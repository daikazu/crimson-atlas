import { describe, expect, it } from 'vitest'
import { extractEmbeddedMapData, transformMapData } from './transform'

const embedded = {
  groups: [
    {
      id: 2,
      title: 'Items',
      color: '5D5285',
      order: 2,
      categories: [
        { id: 21, group_id: 2, title: 'Chest', icon: 'chest', info: null, order: 2, locations_count: 1 },
        { id: 20, group_id: 2, title: 'Armor', icon: 'armor', info: 'Wearable', order: 1, locations_count: 1 },
      ],
    },
    {
      id: 1,
      title: 'Strongholds',
      color: '8A867B',
      order: 1,
      categories: [{ id: 10, group_id: 1, title: 'Stronghold', icon: 'stronghold', info: null, order: 1, locations_count: 1 }],
    },
  ],
  mapConfig: {
    tile_sets: [
      { pattern: 'crimson-desert/oats/faction-v3/{z}/{y}/{x}.jpg', order: 3, min_zoom: 8, max_zoom: 19, tiles_max_zoom: 17 },
      { pattern: 'crimson-desert/pywel/default-v3/{z}/{y}/{x}.jpg', order: 0, min_zoom: 8, max_zoom: 19, tiles_max_zoom: 17 },
    ],
    initial_zoom: 11,
    start_lat: 0.69,
    start_lng: -0.77,
  },
}

const api = {
  regions: [
    { id: 5, title: 'Pailune', order: 60, features: [] },
    { id: 4, title: 'Hernand', order: 10, features: [] },
  ],
  styles: { mapStyle: { bounds: [-1.4, 0, 0, 1.4] } },
  locations: [
    {
      id: 100,
      category_id: 10,
      region_id: 4,
      title: 'Hernand Castle',
      description: null,
      latitude: '0.62122330990415',
      longitude: '-0.84049726123084',
      media: [{ url: 'https://media.example/a.jpg', title: 'shot', type: 'image', order: 10 }],
    },
    {
      id: 101,
      category_id: 20,
      region_id: null,
      title: 'Iron Armor',
      description: 'In a **chest**',
      latitude: '0.5',
      longitude: '-0.5',
      media: [{ url: 'https://media.example/v.mp4', title: 'vid', type: 'video', order: 1 }],
    },
  ],
}

describe('transformMapData', () => {
  const data = transformMapData(api, embedded, '2026-10-06T00:00:00Z')

  it('orders groups and categories by their order field', () => {
    expect(data.groups.map((g) => g.title)).toEqual(['Strongholds', 'Items'])
    expect(data.groups[1].categoryIds).toEqual([20, 21])
    expect(data.categories.map((c) => c.id)).toEqual([10, 20, 21])
  })

  it('maps category fields', () => {
    expect(data.categories[1]).toEqual({ id: 20, groupId: 2, title: 'Armor', icon: 'armor', info: 'Wearable', count: 1 })
  })

  it('parses coordinates and keeps only image media', () => {
    expect(data.locations[0]).toMatchObject({ id: 100, categoryId: 10, regionId: 4, lat: 0.62122330990415, lng: -0.84049726123084 })
    expect(data.locations[0].media).toEqual([{ url: 'https://media.example/a.jpg', title: 'shot' }])
    expect(data.locations[1].media).toEqual([])
    expect(data.locations[1].regionId).toBeNull()
  })

  it('orders regions and builds map config from the lowest-order tile set', () => {
    expect(data.regions).toEqual([{ id: 4, title: 'Hernand' }, { id: 5, title: 'Pailune' }])
    expect(data.config).toEqual({
      tileUrl: 'https://tiles.mapgenie.io/games/crimson-desert/pywel/default-v3/{z}/{y}/{x}.jpg',
      minZoom: 8,
      maxZoom: 19,
      tilesMaxZoom: 17,
      initialZoom: 11,
      center: [-0.77, 0.69],
      bounds: [-1.4, 0, 0, 1.4],
    })
    expect(data.syncedAt).toBe('2026-10-06T00:00:00Z')
  })
})

describe('extractEmbeddedMapData', () => {
  it('pulls the window.mapData object out of page HTML', () => {
    const html = `<script>window.foo = 1; window.mapData = {"groups":[],"x":"};"}; window.bar = 2;</script>`
    expect(extractEmbeddedMapData(html)).toEqual({ groups: [], x: '};' })
  })

  it('throws when mapData is missing', () => {
    expect(() => extractEmbeddedMapData('<html></html>')).toThrow(/mapData/)
  })
})
