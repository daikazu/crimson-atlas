import { app, protocol } from 'electron'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, join, relative, resolve } from 'node:path'
import { dataFiles, downloadMap } from '../src/data/download'

/**
 * `app://local/` serves the built renderer, and `app://local/data/` serves map data —
 * from the user's refreshed copy when present, otherwise the snapshot bundled at build time.
 */
export const APP_ORIGIN = 'app://local'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

const rendererDir = () => join(app.getAppPath(), 'dist')
const bundledDataDir = () => join(app.getAppPath(), app.isPackaged ? 'dist/data' : 'public/data')
const userDataDir = () => join(app.getPath('userData'), 'data')

/** Must run before the app is ready. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
  ])
}

/** Resolves `rel` inside `base`, refusing anything that escapes it. */
function within(base: string, rel: string): string | null {
  const full = resolve(base, rel)
  const r = relative(base, full)
  return r.startsWith('..') || isAbsolute(r) ? null : full
}

export function handleAppScheme(): void {
  protocol.handle('app', async (req) => {
    const path = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html'
    const candidates = path.startsWith('data/')
      ? [within(userDataDir(), path.slice(5)), within(bundledDataDir(), path.slice(5))]
      : [within(rendererDir(), path)]

    for (const file of candidates) {
      if (!file || !existsSync(file)) continue
      const headers = { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Access-Control-Allow-Origin': '*' }
      return new Response(await readFile(file), { headers })
    }
    return new Response('Not found', { status: 404 })
  })
}

export const hasMapData = () => existsSync(join(userDataDir(), 'pywel.json')) || existsSync(join(bundledDataDir(), 'pywel.json'))

/** Downloads fresh data from MapGenie into the user's data folder, swapping it in only once complete. */
export async function refreshMapData(): Promise<{ locations: number }> {
  const map = await downloadMap()
  const target = userDataDir()
  const staging = `${target}.staging`
  await rm(staging, { recursive: true, force: true })
  await mkdir(join(staging, 'sprite'), { recursive: true })
  await Promise.all(dataFiles(map).map(([path, contents]) => writeFile(join(staging, path), contents)))
  await rm(target, { recursive: true, force: true })
  await rename(staging, target)
  return { locations: map.data.locations.length }
}
