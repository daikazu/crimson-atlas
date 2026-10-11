import { app, globalShortcut, type BrowserWindow } from 'electron'
import { overlayAction } from './overlayHotkeys'

const isMac = process.platform === 'darwin'

/** True while the window has been summoned over the game, until it is dismissed again. */
let overlaid = false
let registered: string | null = null

export const isOverlaid = () => overlaid

/** Raises the map above everything, including a borderless or fullscreen game, and gives it the keyboard. */
export function showOverlay(win: BrowserWindow): void {
  overlaid = true
  win.setAlwaysOnTop(true, 'screen-saver')
  // Lets the window join another app's fullscreen space instead of switching away from it.
  if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  if (win.isMinimized()) win.restore()
  win.show()
  if (isMac) app.focus({ steal: true })
  win.focus()
}

/** Puts the window back to how the user keeps it, without hiding it. */
export function endOverlay(win: BrowserWindow, alwaysOnTop: boolean): void {
  if (!overlaid) return
  overlaid = false
  if (isMac) win.setVisibleOnAllWorkspaces(false)
  win.setAlwaysOnTop(alwaysOnTop, 'floating')
}

/** Gets the map out of the way and hands focus back to the game. */
export function hideOverlay(win: BrowserWindow, alwaysOnTop: boolean): void {
  // Hiding the app (macOS) or minimizing (elsewhere) reactivates whatever was in front before; the Dock/taskbar still brings the map back.
  if (isMac) app.hide()
  else win.minimize()
  endOverlay(win, alwaysOnTop)
}

export function toggleOverlay(win: BrowserWindow, alwaysOnTop: boolean): void {
  const presence = { visible: win.isVisible() && !(isMac && app.isHidden()), focused: win.isFocused(), minimized: win.isMinimized() }
  if (overlayAction(presence) === 'hide') hideOverlay(win, alwaysOnTop)
  else showOverlay(win)
}

/** Swaps the system-wide hotkey (null turns it off). Returns false when another app already owns the accelerator. */
export function setOverlayHotkey(accelerator: string | null, onPress: () => void): boolean {
  if (registered) globalShortcut.unregister(registered)
  registered = null
  if (!accelerator) return true
  if (!globalShortcut.register(accelerator, onPress)) return false
  registered = accelerator
  return true
}
