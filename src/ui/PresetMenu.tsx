import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'

export function PresetMenu() {
  const presets = useStore((s) => s.presets)
  const savePreset = useStore((s) => s.savePreset)
  const applyPreset = useStore((s) => s.applyPreset)
  const deletePreset = useStore((s) => s.deletePreset)
  const [name, setName] = useState('')
  const menu = useRef<HTMLDetailsElement>(null)

  // <details> has no light-dismiss; close it on any click outside.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.open = false
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <details className="menu" ref={menu}>
      <summary className="chip">Presets{presets.length > 0 && ` · ${presets.length}`}</summary>
      <div className="menu-body">
        {presets.length === 0 && <p className="hint">Save the current category selection to switch back to it in one click.</p>}
        {presets.map((p) => (
          <div key={p.name} className="preset">
            <button
              className="preset-apply"
              onClick={() => {
                applyPreset(p.name)
                menu.current!.open = false
              }}
            >
              {p.name}
            </button>
            <button className="icon-btn" onClick={() => deletePreset(p.name)} aria-label={`Delete preset ${p.name}`}>
              ×
            </button>
          </div>
        ))}
        <form
          className="preset-save"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) savePreset(name.trim())
            setName('')
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name current selection" aria-label="Preset name" />
          <button type="submit" disabled={!name.trim()}>
            Save
          </button>
        </form>
      </div>
    </details>
  )
}
