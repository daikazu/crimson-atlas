export const DEFAULT_OVERLAY_HOTKEY = 'CommandOrControl+Shift+M'

/** Accelerators offered in the View menu — a few alternatives in case the default clashes with a game binding. */
export const OVERLAY_HOTKEYS = [DEFAULT_OVERLAY_HOTKEY, 'F8', 'F9', 'F10', 'Alt+M']

export const hotkeyLabel = (accelerator: string, isMac: boolean) => accelerator.replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl')

export interface WindowPresence {
  visible: boolean
  focused: boolean
  minimized: boolean
}

/** What the overlay hotkey does: dismiss the map only when it is the thing in front, otherwise bring it up. */
export function overlayAction({ visible, focused, minimized }: WindowPresence): 'show' | 'hide' {
  return visible && focused && !minimized ? 'hide' : 'show'
}
