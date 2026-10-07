import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { useData } from './DataContext'
import { SpriteIcon } from './SpriteIcon'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function SearchBox({ query, onQueryChange, inputRef }: Props) {
  return (
    <div className="search">
      <svg className="search-glyph" viewBox="0 0 20 20" aria-hidden>
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search locations, items, bosses…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Search locations"
        spellCheck={false}
      />
      {query ? (
        <button className="search-clear" onClick={() => onQueryChange('')} aria-label="Clear search">
          ×
        </button>
      ) : (
        <kbd>/</kbd>
      )}
    </div>
  )
}

export function SearchResults({ query, onQueryChange, inputRef }: Props) {
  const { search, locationById, categoryById, regionById } = useData()
  const found = useStore((s) => s.found)
  const select = useStore((s) => s.select)
  const results = useMemo(() => search(query), [search, query])
  const [active, setActive] = useState(0)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const pick = (id: number) => select(id, { fly: true, reveal: true })

  // Arrow keys / Enter / Esc while the search input has focus.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Enter' && results[active] !== undefined) {
        e.preventDefault()
        pick(results[active])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onQueryChange('')
        input.blur()
      }
    }
    input.addEventListener('keydown', onKey)
    return () => input.removeEventListener('keydown', onKey)
  })

  if (results.length === 0) return <p className="empty">No matches for “{query}”.</p>

  return (
    <ol className="results" ref={list} aria-label="Search results">
      {results.map((id, i) => {
        const loc = locationById.get(id)!
        const cat = categoryById.get(loc.categoryId)
        const region = loc.regionId === null ? null : regionById.get(loc.regionId)
        return (
          <li key={id}>
            <button
              data-index={i}
              className={`result ${i === active ? 'is-active' : ''} ${found[id] ? 'is-found' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(id)}
            >
              <SpriteIcon icon={cat?.icon ?? ''} height={30} />
              <span className="result-text">
                <span className="result-title">{loc.title}</span>
                <span className="result-meta">
                  {cat?.title}
                  {region && ` · ${region.title}`}
                </span>
              </span>
              {found[id] && <span className="tick" aria-label="Found">✓</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
