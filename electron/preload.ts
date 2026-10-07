import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { UpdateSummary } from '../src/data/diff'
import type { DesktopApi } from '../src/desktop'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: DesktopApi = {
  dataBase: 'app://local/data',
  downloadData: () => ipcRenderer.invoke('data:download'),
  onDataUpdated: (callback) => subscribe<UpdateSummary>('data:updated', callback),
  importFromMapGenie: () => ipcRenderer.invoke('mapgenie:import'),
  onOpenImport: (callback) => subscribe('menu:open-import', () => callback()),
}

contextBridge.exposeInMainWorld('desktop', api)
