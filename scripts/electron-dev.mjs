/**
 * `npm run desktop`: builds the Electron main/preload scripts, starts the Vite dev server,
 * and launches Electron against it. Renderer changes hot-reload; restart for main-process changes.
 */
import { spawn } from 'node:child_process'
import { build, createServer } from 'vite'
import electronPath from 'electron'

await build({ configFile: 'vite.electron.config.ts', logLevel: 'warn' })

const server = await createServer({ server: { port: 5317 } })
await server.listen()
const url = server.resolvedUrls.local[0]
console.log(`Renderer at ${url}`)

const child = spawn(electronPath, ['.', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, VITE_DEV_SERVER_URL: url } })
child.on('exit', async (code) => {
  await server.close()
  process.exit(code ?? 0)
})
