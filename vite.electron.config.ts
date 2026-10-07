import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

/** Bundles the Electron main and preload scripts to CommonJS in dist-electron/. */
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    minify: false,
    target: 'node22',
    lib: {
      entry: { main: 'electron/main.ts', preload: 'electron/preload.ts' },
      formats: ['cjs'],
      fileName: (_format, name) => `${name}.cjs`,
    },
    rolldownOptions: {
      external: ['electron', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
    },
  },
})
