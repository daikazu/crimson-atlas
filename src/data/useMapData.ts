import { useCallback, useEffect, useState } from 'react'
import { desktop } from '../desktop'
import type { MapData } from './types'

export interface SpriteEntry {
  x: number
  y: number
  width: number
  height: number
  pixelRatio: number
}
export type Sprite = Record<string, SpriteEntry>

type LoadState =
  | { status: 'loading' }
  | { status: 'downloading' }
  | { status: 'error'; error: string; retry: () => void }
  | { status: 'ready'; data: MapData; sprite: Sprite }

const DATA_BASE = desktop?.dataBase ?? '/data'
export const SPRITE_BASE = `${DATA_BASE}/sprite/markers`

class MissingDataError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (res.status === 404) throw new MissingDataError(`${url} not found`)
  if (!res.ok) throw new Error(`${res.status} loading ${url}`)
  return res.json()
}

const fetchAll = () => Promise.all([getJson<MapData>(`${DATA_BASE}/pywel.json`), getJson<Sprite>(`${SPRITE_BASE}@2x.json`)])

export function useMapData(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      let result
      try {
        result = await fetchAll()
      } catch (e) {
        // First launch of the desktop app: nothing downloaded yet.
        if (!(e instanceof MissingDataError) || !desktop) throw e
        setState({ status: 'downloading' })
        await desktop.downloadData()
        result = await fetchAll()
      }
      const [data, sprite] = result
      setState({ status: 'ready', data, sprite })
    } catch (e) {
      const message = e instanceof MissingDataError && !desktop ? 'No map data yet — run `npm run sync` first.' : (e as Error).message
      setState({ status: 'error', error: message, retry: () => void load() })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return state
}
