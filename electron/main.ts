import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { join } from 'node:path'
import { APP_ORIGIN, handleAppScheme, hasMapData, refreshMapData, registerAppScheme } from './appProtocol'
import { importFromMapGenie } from './mapgenieImport'
import { loadWindowState, trackWindowState } from './windowState'

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const isMac = process.platform === 'darwin'

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

async function refreshAndReload(win: BrowserWindow): Promise<void> {
  try {
    const { locations } = await refreshMapData()
    win.webContents.reload()
    void dialog.showMessageBox(win, { message: 'Map data updated', detail: `${locations.toLocaleString()} locations loaded from MapGenie.` })
  } catch (e) {
    dialog.showErrorBox('Could not refresh map data', (e as Error).message)
  }
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
        { label: 'Refresh Map Data', click: () => void refreshAndReload(win) },
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

ipcMain.handle('mapgenie:import', () => (mainWindow ? importFromMapGenie(mainWindow) : null))

app.whenReady().then(async () => {
  handleAppScheme()
  // A build made without `npm run sync` ships no data; fetch it once on first launch.
  if (!hasMapData()) await refreshMapData().catch((e: Error) => dialog.showErrorBox('Could not download map data', e.message))

  mainWindow = createWindow()
  buildMenu(mainWindow)
  mainWindow.on('closed', () => (mainWindow = null))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
      buildMenu(mainWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
