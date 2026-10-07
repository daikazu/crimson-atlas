import { useEffect } from 'react'
import type { Media } from '../data/types'

interface Props {
  media: Media[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}

export function Lightbox({ media, index, onIndexChange, onClose }: Props) {
  const count = media.length
  const go = (delta: number) => onIndexChange((index + delta + count) % count)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else return
      // Keep Esc from also closing the detail panel.
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  })

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Screenshot viewer" onClick={onClose}>
      <img src={media[index].url} alt={media[index].title} onClick={(e) => e.stopPropagation()} />
      {count > 1 && (
        <>
          <button className="lb-nav lb-prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="Previous screenshot">
            ‹
          </button>
          <button className="lb-nav lb-next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label="Next screenshot">
            ›
          </button>
        </>
      )}
      <p className="lb-caption">
        {index + 1} / {count} · Esc to close
      </p>
    </div>
  )
}
