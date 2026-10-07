import { app } from 'electron'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { summarizeUpdate, type UpdateSummary } from '../src/data/diff'
import { dataFiles, downloadMap } from '../src/data/download'
import type { MapData } from '../src/data/types'

/** Map data is never shipped with the app: it is downloaded from MapGenie into the user's data folder. */
export const userDataDir = () => join(app.getPath('userData'), 'data')

/** In development, `npm run sync` output is used until the app has downloaded its own copy. */
export const devDataDir = () => (app.isPackaged ? null : join(app.getAppPath(), 'public/data'))

export const hasMapData = () => existsSync(join(userDataDir(), 'pywel.json')) || !!devDataDir() && existsSync(join(devDataDir()!, 'pywel.json'))

async function readCurrent(): Promise<MapData | null> {
  try {
    return JSON.parse(await readFile(join(userDataDir(), 'pywel.json'), 'utf8')) as MapData
  } catch {
    return null
  }
}

/** True when the downloaded data is missing or older than `maxAgeMs`. */
export async function isStale(maxAgeMs: number): Promise<boolean> {
  const current = await readCurrent()
  return !current || Date.now() - Date.parse(current.syncedAt) > maxAgeMs
}

let inFlight: Promise<UpdateSummary> | null = null

/** Downloads the latest data and swaps it in once complete. Concurrent callers share one download. */
export function updateMapData(): Promise<UpdateSummary> {
  inFlight ??= download().finally(() => (inFlight = null))
  return inFlight
}

async function download(): Promise<UpdateSummary> {
  const map = await downloadMap()
  const previous = await readCurrent()
  const target = userDataDir()
  const staging = `${target}.staging`
  await rm(staging, { recursive: true, force: true })
  await mkdir(join(staging, 'sprite'), { recursive: true })
  await Promise.all(dataFiles(map).map(([path, contents]) => writeFile(join(staging, path), contents)))
  await rm(target, { recursive: true, force: true })
  await rename(staging, target)
  return summarizeUpdate(previous, map.data)
}
