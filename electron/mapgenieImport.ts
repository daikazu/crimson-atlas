import { BrowserWindow } from 'electron'
import { MAP_PAGE_URL } from '../src/data/download'

/** Logged-in MapGenie map pages embed the user's found locations as `window.user.locations` ({"id": true}). */
const READ_USER = `(() => {
  const u = window.user
  return u && u.id ? { locations: u.locations || {} } : null
})()`

/**
 * Opens MapGenie in a window with its own persistent session. If already signed in, reads the found
 * locations straight away without showing anything; otherwise shows the window so the user can sign in.
 * Resolves with the found location ids, or null if the user closes the window first.
 */
export function importFromMapGenie(parent: BrowserWindow): Promise<number[] | null> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      parent,
      width: 1100,
      height: 820,
      show: false,
      title: 'Sign in to MapGenie',
      backgroundColor: '#121214',
      webPreferences: { partition: 'persist:mapgenie', contextIsolation: true, sandbox: true },
    })

    let done = false
    const finish = (ids: number[] | null) => {
      if (done) return
      done = true
      clearInterval(poll)
      resolve(ids)
      if (!win.isDestroyed()) win.close()
    }

    const check = async () => {
      if (done || win.isDestroyed() || win.webContents.isLoading()) return
      const user = (await win.webContents.executeJavaScript(READ_USER).catch(() => null)) as { locations: Record<string, boolean> } | null
      if (!user) {
        if (!win.isVisible()) win.show()
        return
      }
      if (!win.webContents.getURL().startsWith(MAP_PAGE_URL)) {
        // Signed in somewhere else on the site; the Pywel map page is where the progress lives.
        void win.loadURL(MAP_PAGE_URL)
        return
      }
      finish(Object.entries(user.locations).filter(([, v]) => v).map(([k]) => Number(k)))
    }

    // Sign-in may finish without a full page load, so poll as well.
    const poll = setInterval(check, 1500)
    win.webContents.on('did-finish-load', check)
    win.on('closed', () => finish(null))
    void win.loadURL(MAP_PAGE_URL)
  })
}
