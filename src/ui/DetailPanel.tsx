import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { useData } from './DataContext'
import { Lightbox } from './Lightbox'
import { renderDescription } from './markdown'
import { SpriteIcon } from './SpriteIcon'

export function DetailPanel() {
  const { locationById, categoryById, groupById, regionById } = useData()
  const selectedId = useStore((s) => s.selectedId)
  const isFound = useStore((s) => (selectedId === null ? false : s.found[selectedId] === true))
  const toggleFound = useStore((s) => s.toggleFound)
  const select = useStore((s) => s.select)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loc = selectedId === null ? undefined : locationById.get(selectedId)
  const html = useMemo(() => (loc?.description ? renderDescription(loc.description) : null), [loc])
  if (!loc) return null

  const cat = categoryById.get(loc.categoryId)
  const group = cat ? groupById.get(cat.groupId) : undefined
  const region = loc.regionId === null ? undefined : regionById.get(loc.regionId)

  return (
    <aside className="detail" aria-label="Location details" key={loc.id}>
      <button className="detail-close" onClick={() => select(null)} aria-label="Close details (Esc)">
        ×
      </button>

      <div className="detail-head">
        <SpriteIcon icon={cat?.icon ?? ''} height={52} />
        <div>
          <p className="detail-kicker" style={{ color: group ? `#${group.color}` : undefined }}>
            {group?.title}
          </p>
          <h2>{loc.title}</h2>
          <p className="detail-sub">
            {cat?.title}
            {region && <> · {region.title}</>}
          </p>
        </div>
      </div>

      <button className={`found-btn ${isFound ? 'is-found' : ''}`} onClick={() => toggleFound(loc.id)}>
        <span className="found-box" aria-hidden>
          {isFound ? '✓' : ''}
        </span>
        {isFound ? 'Found' : 'Mark as found'}
        <kbd>F</kbd>
      </button>

      <div className="detail-body">
        {html ? (
          // Sanitized with DOMPurify in renderDescription.
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="prose muted">No notes for this location yet.</p>
        )}
        {cat?.info && <p className="cat-info">{cat.info}</p>}

        {loc.media.length > 0 && (
          <div className="gallery">
            {loc.media.map((m, i) => (
              <button key={m.url} className="thumb" onClick={() => setLightboxIndex(i)} aria-label={`Open screenshot ${i + 1}`}>
                <img src={m.url} alt={`${loc.title} screenshot ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="detail-foot">
        <span>
          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
        </span>
        <a href={`https://mapgenie.io/crimson-desert/maps/pywel?locationIds=${loc.id}`} target="_blank" rel="noreferrer">
          Open on MapGenie ↗
        </a>
      </footer>

      {lightboxIndex !== null && <Lightbox media={loc.media} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />}
    </aside>
  )
}
