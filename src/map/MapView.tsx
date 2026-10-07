import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, MapGeoJSONFeature } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useMemo, useRef } from 'react'
import type { MapData } from '../data/types'
import { SPRITE_BASE } from '../data/useMapData'
import { useStore } from '../state/store'
import { buildMarkerFilter, toFeatureCollection } from './filterExpression'

// Point MapLibre at its worker explicitly so Vite emits it in production builds.
maplibregl.setWorkerUrl(workerUrl)

const MARKERS = 'markers'
const SELECTED = 'selected-halo'
const SELECTED_ICON = 'selected-icon'

export function MapView({ data }: { data: MapData }) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const loaded = useRef(false)

  const found = useStore((s) => s.found)
  const hidden = useStore((s) => s.hidden)
  const hideFound = useStore((s) => s.hideFound)
  const regionId = useStore((s) => s.regionId)
  const selectedId = useStore((s) => s.selectedId)
  const revealedId = useStore((s) => s.revealedId)
  const flyToken = useStore((s) => s.flyToken)

  const locationsById = useMemo(() => new Map(data.locations.map((l) => [l.id, l])), [data])
  const filter = useMemo(() => buildMarkerFilter({ hiddenCategoryIds: hidden, regionId, hideFound, revealedId }), [hidden, regionId, hideFound, revealedId])

  // Create the map once.
  useEffect(() => {
    const { config } = data
    const [w, s, e, n] = config.bounds
    const pad = 0.15
    const map = new maplibregl.Map({
      container: container.current!,
      center: config.center,
      zoom: config.initialZoom,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      maxBounds: [
        [w - pad, s - pad],
        [e + pad, n + pad],
      ],
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
      style: {
        version: 8,
        sprite: new URL(SPRITE_BASE, window.location.href).href,
        sources: {
          tiles: { type: 'raster', tiles: [config.tileUrl], tileSize: 256, minzoom: config.minZoom, maxzoom: config.tilesMaxZoom },
          [MARKERS]: { type: 'geojson', data: toFeatureCollection(data.locations, data.categories, useStore.getState().found) },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#0b0c0e' } },
          { id: 'tiles', type: 'raster', source: 'tiles', paint: { 'raster-fade-duration': 150 } },
          {
            id: MARKERS,
            type: 'symbol',
            source: MARKERS,
            layout: {
              'icon-image': ['get', 'icon'],
              'icon-anchor': 'bottom',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.38, 11, 0.5, 13, 0.7, 15, 0.9],
              'symbol-sort-key': ['get', 'f'],
            },
            paint: { 'icon-opacity': ['case', ['==', ['get', 'f'], 1], 0.35, 1] },
          },
          {
            id: SELECTED,
            type: 'circle',
            source: MARKERS,
            filter: ['==', ['id'], -1],
            paint: {
              'circle-radius': 30,
              'circle-color': 'rgba(255, 122, 69, 0.22)',
              'circle-stroke-color': '#ff8a4c',
              'circle-stroke-width': 3.5,
              'circle-blur': 0.1,
              'circle-translate': [0, -30],
            },
          },
          {
            id: SELECTED_ICON,
            type: 'symbol',
            source: MARKERS,
            filter: ['==', ['id'], -1],
            layout: {
              'icon-image': ['get', 'icon'],
              'icon-anchor': 'bottom',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-size': 1.15,
            },
          },
        ],
      },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.on('load', () => {
      loaded.current = true
      const s = useStore.getState()
      map.setFilter(MARKERS, buildMarkerFilter({ hiddenCategoryIds: s.hidden, regionId: s.regionId, hideFound: s.hideFound, revealedId: s.revealedId }))
      for (const layer of [SELECTED, SELECTED_ICON]) map.setFilter(layer, ['==', ['id'], s.selectedId ?? -1])
      const loc = s.selectedId === null ? undefined : data.locations.find((l) => l.id === s.selectedId)
      if (loc) map.jumpTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 14) })
    })

    const featureId = (f: MapGeoJSONFeature | undefined) => (f ? Number(f.id) : null)
    map.on('click', MARKERS, (ev) => {
      const id = featureId(ev.features?.[0])
      if (id !== null) useStore.getState().select(id)
    })
    map.on('contextmenu', MARKERS, (ev) => {
      ev.preventDefault()
      const id = featureId(ev.features?.[0])
      if (id !== null) useStore.getState().toggleFound(id)
    })
    map.on('click', (ev) => {
      if (map.queryRenderedFeatures(ev.point, { layers: [MARKERS] }).length === 0) useStore.getState().select(null)
    })
    map.on('mouseenter', MARKERS, () => (map.getCanvas().style.cursor = 'pointer'))
    map.on('mouseleave', MARKERS, () => (map.getCanvas().style.cursor = ''))

    // Keep the canvas sized to its grid cell when the side panels open/close.
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container.current!)

    mapRef.current = map
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      loaded.current = false
    }
  }, [data])

  useEffect(() => {
    const src = mapRef.current?.getSource<GeoJSONSource>(MARKERS)
    src?.setData(toFeatureCollection(data.locations, data.categories, found))
  }, [data, found])

  useEffect(() => {
    if (loaded.current) mapRef.current?.setFilter(MARKERS, filter)
  }, [filter])

  useEffect(() => {
    if (!loaded.current) return
    for (const layer of [SELECTED, SELECTED_ICON]) mapRef.current?.setFilter(layer, ['==', ['id'], selectedId ?? -1])
  }, [selectedId])

  useEffect(() => {
    const map = mapRef.current
    const loc = selectedId === null ? undefined : locationsById.get(selectedId)
    if (!map || !loc || flyToken === 0) return
    map.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 14), duration: 900 })
    // Only react to explicit fly requests, not every selection change.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToken])

  return <div ref={container} className="map" />
}
