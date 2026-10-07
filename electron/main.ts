import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { join } from 'node:path'
import type { UpdateSummary } from '../src/data/diff'
import { APP_ORIGIN, handleAppScheme, registerAppScheme } from './appProtocol'
import { hasMapData, isStale, updateMapData } from './mapData'
import { importFromMapGenie } from './mapgenieImport'
import { loadWindowState, trackWindowState } from './windowState'

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const isMac = process.platform === 'darwin'

/** How old the data may get before a background check downloads it again. */
const MAX_DATA_AGE_MS = 6 * 60 * 60 * 1000
const CHECK_INTERVAL_MS = 60 * 60 * 1000

app.setName('Crimson Atlas')
registerAppScheme()

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const state = loadWindowState()
  const win = new BrowserWindow({
    ...state.bounds,
    minWidth: 960,
    minHeight: 600,
    title: 'Crimson Atlas',
    backgroundColor: '#121214',
    show: false,
    webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true },
  })
  if (state.maximized) win.maximize()
  win.setAlwaysOnTop(state.alwaysOnTop, 'floating')
  trackWindowState(win)
  win.once('ready-to-show', () => win.show())

  // Links in location notes (e.g. "Open on MapGenie") go to the system browser, never a new app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(DEV_SERVER_URL ?? APP_ORIGIN)) {
      event.preventDefault()
      if (url.startsWith('https://')) void shell.openExternal(url)
    }
  })

  void win.loadURL(DEV_SERVER_URL ?? `${APP_ORIGIN}/index.html`)
  return win
}

const describeUpdate = (u: UpdateSummary) =>
  [u.added && `${u.added.toLocaleString()} new`, u.removed && `${u.removed.toLocaleString()} removed`].filter(Boolean).join(', ') ||
  'location details updated'

/** Menu command: check now, and reload straight away if anything changed. */
async function checkNow(win: BrowserWindow): Promise<void> {
  try {
    const update = await updateMapData()
    if (update.changed) win.webContents.reload()
    void dialog.showMessageBox(win, {
      message: update.changed ? 'Map data updated' : 'Map data is up to date',
      detail: update.changed ? `${describeUpdate(update)} · ${update.total.toLocaleString()} locations in total.` : `${update.total.toLocaleString()} locations.`,
    })
  } catch (e) {
    dialog.showErrorBox('Could not check for map updates', (e as Error).message)
  }
}

/** Background checks: when the data is old enough, download it and let the renderer offer a reload. */
function scheduleUpdateChecks(win: BrowserWindow): void {
  const check = async () => {
    // First-run downloads are driven by the renderer's loading screen.
    if (win.isDestroyed() || !hasMapData() || !(await isStale(MAX_DATA_AGE_MS))) return
    try {
      const update = await updateMapData()
      if (update.changed && !win.isDestroyed()) win.webContents.send('data:updated', update)
    } catch (e) {
      console.warn('Background map update failed:', (e as Error).message)
    }
  }
  win.webContents.once('did-finish-load', () => void check())
  const timer = setInterval(() => void check(), CHECK_INTERVAL_MS)
  win.on('closed', () => clearInterval(timer))
}

function buildMenu(win: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' } as const] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'Map',
      submenu: [
        { label: 'Import Progress from MapGenie…', accelerator: 'CmdOrCtrl+I', click: () => win.webContents.send('menu:open-import') },
        { label: 'Check for Map Updates', click: () => void checkNow(win) },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Always on Top',
          type: 'checkbox',
          checked: win.isAlwaysOnTop(),
          accelerator: 'CmdOrCtrl+Shift+T',
          click: (item) => win.setAlwaysOnTop(item.checked, 'floating'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function openMainWindow(): void {
  const win = createWindow()
  mainWindow = win
  buildMenu(win)
  scheduleUpdateChecks(win)
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
}

ipcMain.handle('mapgenie:import', () => (mainWindow ? importFromMapGenie(mainWindow) : null))
ipcMain.handle('data:download', () => updateMapData())

app.whenReady().then(() => {
  handleAppScheme()
  openMainWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
