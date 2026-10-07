import { app, protocol } from 'electron'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, join, relative, resolve } from 'node:path'
import { devDataDir, userDataDir } from './mapData'

/** `app://local/` serves the built renderer, and `app://local/data/` serves the downloaded map data. */
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

/** Must run before the app is ready. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
  ])
}

/** Resolves `rel` inside `base`, refusing anything that escapes it. */
function within(base: string | null, rel: string): string | null {
  if (!base) return null
  const full = resolve(base, rel)
  const r = relative(base, full)
  return r.startsWith('..') || isAbsolute(r) ? null : full
}

export function handleAppScheme(): void {
  protocol.handle('app', async (req) => {
    const path = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html'
    const isData = path.startsWith('data/')
    const candidates = isData
      ? [within(userDataDir(), path.slice(5)), within(devDataDir(), path.slice(5))]
      : [within(rendererDir(), path)]

    for (const file of candidates) {
      if (!file || !existsSync(file)) continue
      const headers: Record<string, string> = {
        'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      }
      // Data changes in place when MapGenie updates; never serve a stale cached copy.
      if (isData) headers['Cache-Control'] = 'no-store'
      return new Response(await readFile(file), { headers })
    }
    return new Response('Not found', { status: 404 })
  })
}
