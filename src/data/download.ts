import { extractEmbeddedMapData, transformMapData, type RawApiData } from './transform'
import type { MapData } from './types'

const MAP_ID = 887
export const MAP_PAGE_URL = 'https://mapgenie.io/crimson-desert/maps/pywel'
const API_URL = `https://mapgenie.io/api/v1/maps/${MAP_ID}/data`
const SPRITE_URL = 'https://media.mapgenie.io/v2/assets/prod/games/crimson-desert/markers/markers@2x'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36',
  Referer: MAP_PAGE_URL,
}

export interface DownloadedMap {
  data: MapData
  spriteJson: string
  spritePng: ArrayBuffer
}

async function get(url: string, accept = '*/*'): Promise<Response> {
  const res = await fetch(url, { headers: { ...HEADERS, Accept: accept } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`)
  return res
}

/** Downloads the Pywel map data and marker sprite from MapGenie. Used by `npm run sync` and the desktop app. */
export async function downloadMap(): Promise<DownloadedMap> {
  const [html, api, spriteJson, spritePng] = await Promise.all([
    get(MAP_PAGE_URL, 'text/html').then((r) => r.text()),
    get(API_URL, 'application/json').then((r) => r.json() as Promise<RawApiData>),
    get(`${SPRITE_URL}.json`).then((r) => r.text()),
    get(`${SPRITE_URL}.png`).then((r) => r.arrayBuffer()),
  ])
  return { data: transformMapData(api, extractEmbeddedMapData(html), new Date().toISOString()), spriteJson, spritePng }
}

/**
 * The files the app reads, relative to its data directory.
 * MapLibre requests the 1x sprite on non-retina screens; the @2x entries carry pixelRatio: 2, so serve them for both.
 */
export function dataFiles({ data, spriteJson, spritePng }: DownloadedMap): [path: string, contents: string | Uint8Array][] {
  const png = new Uint8Array(spritePng)
  return [
    ['pywel.json', JSON.stringify(data)],
    ...['markers@2x', 'markers'].flatMap((name): [string, string | Uint8Array][] => [
      [`sprite/${name}.json`, spriteJson],
      [`sprite/${name}.png`, png],
    ]),
  ]
}
