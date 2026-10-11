import { describe, expect, it } from 'vitest'
import { hotkeyLabel, overlayAction } from './overlayHotkeys'

describe('overlayAction', () => {
  it('hides the map when it is in front and focused', () => {
    expect(overlayAction({ visible: true, focused: true, minimized: false })).toBe('hide')
  })

  it('shows the map when it is hidden', () => {
    expect(overlayAction({ visible: false, focused: false, minimized: false })).toBe('show')
  })

  it('shows the map when it is minimized', () => {
    expect(overlayAction({ visible: true, focused: false, minimized: true })).toBe('show')
  })

  it('brings the map forward when it is visible but the game has focus', () => {
    expect(overlayAction({ visible: true, focused: false, minimized: false })).toBe('show')
  })
})

describe('hotkeyLabel', () => {
  it('names the platform modifier', () => {
    expect(hotkeyLabel('CommandOrControl+Shift+M', true)).toBe('Cmd+Shift+M')
    expect(hotkeyLabel('CommandOrControl+Shift+M', false)).toBe('Ctrl+Shift+M')
  })

  it('leaves plain keys alone', () => {
    expect(hotkeyLabel('F8', true)).toBe('F8')
  })
})
