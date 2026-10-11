import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { join } from 'node:path'
import type { UpdateSummary } from '../src/data/diff'
import { APP_ORIGIN, handleAppScheme, registerAppScheme } from './appProtocol'
import { hasMapData, isStale, updateMapData } from './mapData'
import { importFromMapGenie } from './mapgenieImport'
import { endOverlay, hideOverlay, isOverlaid, setOverlayHotkey, toggleOverlay } from './overlay'
import { hotkeyLabel, OVERLAY_HOTKEYS } from './overlayHotkeys'
import { loadWindowState, trackWindowState, type WindowPrefs } from './windowState'

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const isMac = process.platform === 'darwin'

/** How old the data may get before a background check downloads it again. */
const MAX_DATA_AGE_MS = 6 * 60 * 60 * 1000
const CHECK_INTERVAL_MS = 60 * 60 * 1000

app.setName('Crimson Atlas')
registerAppScheme()

let mainWindow: BrowserWindow | null = null
let prefs: WindowPrefs = { alwaysOnTop: false, overlayHotkey: null }

function createWindow(): BrowserWindow {
  const state = loadWindowState()
  prefs = { alwaysOnTop: state.alwaysOnTop, overlayHotkey: state.overlayHotkey }
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
  trackWindowState(win, () => prefs)
  // The overlay's raised level is temporary; don't leave it behind on a window that is going away.
  win.on('close', () => endOverlay(win, prefs.alwaysOnTop))
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

/** Overlay hotkey: summon the map over the game, or dismiss it again. Reopens the window if it was closed. */
function onOverlayHotkey(): void {
  if (mainWindow) toggleOverlay(mainWindow, prefs.alwaysOnTop)
  else openMainWindow()
}

/** Registers the saved hotkey, turning it off (and saying so) when another app already owns it. */
function applyOverlayHotkey(accelerator: string | null): void {
  if (setOverlayHotkey(accelerator, onOverlayHotkey)) {
    prefs.overlayHotkey = accelerator
    return
  }
  prefs.overlayHotkey = null
  dialog.showErrorBox(
    'Overlay hotkey unavailable',
    `${hotkeyLabel(accelerator!, isMac)} is already used by another app. Pick a different one under View → Overlay Hotkey.`,
  )
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
          checked: prefs.alwaysOnTop,
          accelerator: 'CmdOrCtrl+Shift+T',
          click: (item) => {
            prefs.alwaysOnTop = item.checked
            if (!isOverlaid()) win.setAlwaysOnTop(item.checked, 'floating')
          },
        },
        {
          label: 'Overlay Hotkey',
          submenu: [...OVERLAY_HOTKEYS, null].map((accelerator) => ({
            label: accelerator ? hotkeyLabel(accelerator, isMac) : 'Off',
            type: 'radio' as const,
            checked: prefs.overlayHotkey === accelerator,
            click: () => {
              applyOverlayHotkey(accelerator)
              // A refused hotkey falls back to Off, so redraw the radio group.
              buildMenu(win)
            },
          })),
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
ipcMain.on('overlay:dismiss', () => {
  if (mainWindow && isOverlaid()) hideOverlay(mainWindow, prefs.alwaysOnTop)
})

app.whenReady().then(() => {
  handleAppScheme()
  openMainWindow()
  applyOverlayHotkey(prefs.overlayHotkey)
  if (mainWindow) buildMenu(mainWindow)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
