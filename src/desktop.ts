/** Bridge exposed by the Electron preload script. Undefined when running in a plain browser. */
export interface DesktopApi {
  /** Base URL for map data (the desktop app serves refreshed data from the user's data folder). */
  dataBase: string
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
