import { useEffect, useRef, useState } from 'react'
import { desktop } from '../desktop'
import { exportProgress, parseProgress } from '../progress/importProgress'
import { useStore } from '../state/store'
import { useData } from './DataContext'

const SNIPPET = 'copy(JSON.stringify(user.locations))'

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { locationById } = useData()
  const found = useStore((s) => s.found)
  const importFound = useStore((s) => s.importFound)
  const dialog = useRef<HTMLDialogElement>(null)
  const [text, setText] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const apply = (allIds: number[], mode: 'merge' | 'replace') => {
    const ids = allIds.filter((id) => locationById.has(id))
    if (ids.length === 0) throw new Error('None of those ids match locations on this map.')
    const before = Object.keys(found).length
    importFound(ids, mode)
    const after = Object.keys(useStore.getState().found).length
    setMessage({ kind: 'ok', text: mode === 'merge' ? `Imported ${ids.length} locations — ${after - before} new. ${after} found in total.` : `Progress replaced: ${after} found.` })
  }

  const run = (mode: 'merge' | 'replace') => {
    try {
      apply(parseProgress(text), mode)
      setText('')
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message })
    }
  }

  const signInAndImport = async () => {
    if (!desktop) return
    setSigningIn(true)
    setMessage(null)
    try {
      const ids = await desktop.importFromMapGenie()
      if (ids === null) setMessage({ kind: 'error', text: 'Sign-in window closed before progress was read.' })
      else if (ids.length === 0) setMessage({ kind: 'ok', text: 'Signed in, but your MapGenie account has no found locations on this map.' })
      else apply(ids, 'merge')
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message })
    } finally {
      setSigningIn(false)
    }
  }

  const download = () => {
    const blob = new Blob([exportProgress(found)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pywel-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <dialog ref={dialog} className="dialog" onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current.close()}>
      <div className="dialog-inner">
        <h2>Import / export progress</h2>

        {desktop && (
          <div className="signin">
            <button className="primary" onClick={signInAndImport} disabled={signingIn}>
              {signingIn ? 'Waiting for MapGenie…' : 'Sign in to MapGenie & import'}
            </button>
            <p className="hint">Opens MapGenie in a window. Your sign-in is remembered for next time. Or paste manually:</p>
          </div>
        )}

        <ol className="steps">
          <li>
            Open the{' '}
            <a href="https://mapgenie.io/crimson-desert/maps/pywel" target="_blank" rel="noreferrer">
              MapGenie Pywel map
            </a>{' '}
            while logged in.
          </li>
          <li>
            Open DevTools (<kbd>⌥⌘J</kbd>), run <code>{SNIPPET}</code>{' '}
            <button className="link-btn" onClick={() => navigator.clipboard.writeText(SNIPPET)}>
              copy
            </button>
          </li>
          <li>Paste below. A backup file exported from this app works too.</li>
        </ol>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) setText(await file.text())
          }}
          placeholder='{"123456":true,"123457":true,…}  — or drop a backup .json file here'
          rows={5}
          spellCheck={false}
        />

        {message && <p className={`msg msg-${message.kind}`}>{message.text}</p>}

        <div className="dialog-actions">
          <button onClick={download}>Download backup ({Object.keys(found).length})</button>
          <span className="spacer" />
          <button onClick={() => run('replace')} disabled={!text.trim()}>
            Replace
          </button>
          <button className="primary" onClick={() => run('merge')} disabled={!text.trim()}>
            Merge import
          </button>
          <button onClick={() => dialog.current?.close()}>Close</button>
        </div>
      </div>
    </dialog>
  )
}
