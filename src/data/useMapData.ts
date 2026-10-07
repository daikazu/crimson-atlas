import { useEffect, useState } from 'react'
import type { MapData } from './types'

export interface SpriteEntry {
  x: number
  y: number
  width: number
  height: number
  pixelRatio: number
}
export type Sprite = Record<string, SpriteEntry>

type LoadState = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; data: MapData; sprite: Sprite }

export const SPRITE_BASE = '/data/sprite/markers'

export function useMapData(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const getJson = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} loading ${url} — run \`npm run sync\` first.`)
      return res.json()
    }
    Promise.all([getJson<MapData>('/data/pywel.json'), getJson<Sprite>(`${SPRITE_BASE}@2x.json`)])
      .then(([data, sprite]) => setState({ status: 'ready', data, sprite }))
      .catch((e: Error) => setState({ status: 'error', error: e.message }))
  }, [])

  return state
}
