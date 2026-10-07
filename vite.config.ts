import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // MapLibre loads its worker relative to its own module URL; pre-bundling moves the module and breaks that.
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
