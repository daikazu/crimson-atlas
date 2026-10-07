import { useEffect, useState } from 'react'
import type { UpdateSummary } from '../data/diff'
import { desktop } from '../desktop'

/** Offers a reload when a background check has downloaded newer MapGenie data. */
export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateSummary | null>(null)
  useEffect(() => desktop?.onDataUpdated(setUpdate), [])
  if (!update) return null

  const parts = [update.added > 0 && `${update.added.toLocaleString()} new`, update.removed > 0 && `${update.removed.toLocaleString()} removed`].filter(Boolean)
  const text = parts.length ? `MapGenie map updated: ${parts.join(', ')} location${update.added + update.removed === 1 ? '' : 's'}.` : 'MapGenie updated some location details.'

  return (
    <div className="update-banner" role="status">
      <span>{text}</span>
      <button className="primary" onClick={() => window.location.reload()}>
        Reload
      </button>
      <button className="icon-btn" onClick={() => setUpdate(null)} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
