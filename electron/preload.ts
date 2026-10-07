import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi } from '../src/desktop'

const api: DesktopApi = {
  dataBase: 'app://local/data',
  importFromMapGenie: () => ipcRenderer.invoke('mapgenie:import'),
  onOpenImport: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('menu:open-import', listener)
    return () => ipcRenderer.removeListener('menu:open-import', listener)
  },
}

contextBridge.exposeInMainWorld('desktop', api)
