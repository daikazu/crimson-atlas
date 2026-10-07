import type { UpdateSummary } from './data/diff'

/** Bridge exposed by the Electron preload script. Undefined when running in a plain browser. */
export interface DesktopApi {
  /** Base URL for map data, served from the user's data folder. */
  dataBase: string
  /** Downloads the latest map data from MapGenie (used on first launch). */
  downloadData: () => Promise<UpdateSummary>
  /** Called when a background check has downloaded changed data; returns an unsubscribe function. */
  onDataUpdated: (callback: (update: UpdateSummary) => void) => () => void
  /** Signs in to MapGenie if needed and returns the found location ids, or null if cancelled. */
  importFromMapGenie: () => Promise<number[] | null>
  /** Subscribes to the "Import Progress" menu item; returns an unsubscribe function. */
  onOpenImport: (callback: () => void) => () => void
}

declare global {
  interface Window {
    desktop?: DesktopApi
  }
}

export const desktop: DesktopApi | undefined = typeof window === 'undefined' ? undefined : window.desktop
