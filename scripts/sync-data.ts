/**
 * Downloads the Pywel map data from MapGenie and writes a trimmed copy to public/data.
 * Run with `npm run sync` whenever MapGenie adds new locations.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { extractEmbeddedMapData, transformMapData, type RawApiData } from '../src/data/transform.ts'

const MAP_ID = 887
const PAGE_URL = 'https://mapgenie.io/crimson-desert/maps/pywel'
const API_URL = `https://mapgenie.io/api/v1/maps/${MAP_ID}/data`
const SPRITE_URL = 'https://media.mapgenie.io/v2/assets/prod/games/crimson-desert/markers/markers@2x'
const OUT_DIR = new URL('../public/data/', import.meta.url)

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36',
  Referer: PAGE_URL,
}

async function get(url: string, accept = '*/*'): Promise<Response> {
  const res = await fetch(url, { headers: { ...headers, Accept: accept } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`)
  return res
}

const [html, api, spriteJson, spritePng] = await Promise.all([
  get(PAGE_URL, 'text/html').then((r) => r.text()),
  get(API_URL, 'application/json').then((r) => r.json() as Promise<RawApiData>),
  get(`${SPRITE_URL}.json`).then((r) => r.text()),
  get(`${SPRITE_URL}.png`).then((r) => r.arrayBuffer()),
])

const data = transformMapData(api, extractEmbeddedMapData(html), new Date().toISOString())

await mkdir(new URL('sprite/', OUT_DIR), { recursive: true })
await Promise.all([
  writeFile(new URL('pywel.json', OUT_DIR), JSON.stringify(data)),
  // MapLibre requests the 1x sprite on non-retina screens; the @2x entries carry pixelRatio: 2, so serve them for both.
  ...['markers@2x', 'markers'].flatMap((name) => [
    writeFile(new URL(`sprite/${name}.json`, OUT_DIR), spriteJson),
    writeFile(new URL(`sprite/${name}.png`, OUT_DIR), Buffer.from(spritePng)),
  ]),
])

console.log(
  `Synced ${data.locations.length} locations, ${data.categories.length} categories, ${data.groups.length} groups, ${data.regions.length} regions.`,
)
