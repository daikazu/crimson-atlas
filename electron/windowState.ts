import { app, screen, type BrowserWindow, type Rectangle } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_OVERLAY_HOTKEY } from './overlayHotkeys'

export interface WindowState {
  bounds: Partial<Rectangle> & { width: number; height: number }
  maximized: boolean
  alwaysOnTop: boolean
  /** Accelerator that summons the map over the game; null when turned off. */
  overlayHotkey: string | null
}

/** The settings the user picks from the menu, as opposed to where the window happens to be. */
export type WindowPrefs = Pick<WindowState, 'alwaysOnTop' | 'overlayHotkey'>

const DEFAULT: WindowState = { bounds: { width: 1600, height: 1000 }, maximized: false, alwaysOnTop: false, overlayHotkey: DEFAULT_OVERLAY_HOTKEY }
const file = () => join(app.getPath('userData'), 'window-state.json')

/** True when the rectangle overlaps a connected display — guards against a since-unplugged second monitor. */
function isVisible(b: Partial<Rectangle>): boolean {
  if (b.x === undefined || b.y === undefined || !b.width || !b.height) return false
  return screen.getAllDisplays().some(({ workArea: w }) => b.x! < w.x + w.width && b.x! + b.width! > w.x && b.y! < w.y + w.height && b.y! + b.height! > w.y)
}

export function loadWindowState(): WindowState {
  try {
    // Files written before a setting existed fall back to its default.
    const saved = { ...DEFAULT, ...(JSON.parse(readFileSync(file(), 'utf8')) as Partial<WindowState>) }
    const { width, height } = saved.bounds
    return { ...saved, bounds: isVisible(saved.bounds) ? saved.bounds : { width, height } }
  } catch {
    return DEFAULT
  }
}

export function trackWindowState(win: BrowserWindow, prefs: () => WindowPrefs): void {
  win.on('close', () => {
    const state: WindowState = { bounds: win.getNormalBounds(), maximized: win.isMaximized(), ...prefs() }
    try {
      writeFileSync(file(), JSON.stringify(state))
    } catch (e) {
      console.error('Could not save window state', e)
    }
  })
}
