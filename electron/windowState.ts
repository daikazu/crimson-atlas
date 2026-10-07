import { app, screen, type BrowserWindow, type Rectangle } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface WindowState {
  bounds: Partial<Rectangle> & { width: number; height: number }
  maximized: boolean
  alwaysOnTop: boolean
}

const DEFAULT: WindowState = { bounds: { width: 1600, height: 1000 }, maximized: false, alwaysOnTop: false }
const file = () => join(app.getPath('userData'), 'window-state.json')

/** True when the rectangle overlaps a connected display — guards against a since-unplugged second monitor. */
function isVisible(b: Partial<Rectangle>): boolean {
  if (b.x === undefined || b.y === undefined || !b.width || !b.height) return false
  return screen.getAllDisplays().some(({ workArea: w }) => b.x! < w.x + w.width && b.x! + b.width! > w.x && b.y! < w.y + w.height && b.y! + b.height! > w.y)
}

export function loadWindowState(): WindowState {
  try {
    const saved = JSON.parse(readFileSync(file(), 'utf8')) as WindowState
    const { width, height } = saved.bounds
    return { ...saved, bounds: isVisible(saved.bounds) ? saved.bounds : { width, height } }
  } catch {
    return DEFAULT
  }
}

export function trackWindowState(win: BrowserWindow): void {
  win.on('close', () => {
    const state: WindowState = { bounds: win.getNormalBounds(), maximized: win.isMaximized(), alwaysOnTop: win.isAlwaysOnTop() }
    try {
      writeFileSync(file(), JSON.stringify(state))
    } catch (e) {
      console.error('Could not save window state', e)
    }
  })
}
