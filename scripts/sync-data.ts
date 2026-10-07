/**
 * Downloads the Pywel map data from MapGenie and writes a trimmed copy to public/data.
 * Run with `npm run sync` whenever MapGenie adds new locations.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dataFiles, downloadMap } from '../src/data/download.ts'

const OUT_DIR = new URL('../public/data/', import.meta.url)

const map = await downloadMap()
await mkdir(new URL('sprite/', OUT_DIR), { recursive: true })
await Promise.all(dataFiles(map).map(([path, contents]) => writeFile(new URL(path, OUT_DIR), contents)))

const { data } = map
console.log(
  `Synced ${data.locations.length} locations, ${data.categories.length} categories, ${data.groups.length} groups, ${data.regions.length} regions.`,
)
