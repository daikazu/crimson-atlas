import { useMemo, useState } from 'react'
import { computeProgress, formatPercent, percent } from '../state/selectors'
import { useStore } from '../state/store'
import { useData } from './DataContext'
import { FilterPanel } from './FilterPanel'
import { PresetMenu } from './PresetMenu'
import { SearchBox, SearchResults } from './SearchBox'

export function Sidebar({ searchRef, onOpenImport }: { searchRef: React.RefObject<HTMLInputElement | null>; onOpenImport: () => void }) {
  const { data } = useData()
  const found = useStore((s) => s.found)
  const regionId = useStore((s) => s.regionId)
  const hideFound = useStore((s) => s.hideFound)
  const setRegion = useStore((s) => s.setRegion)
  const setHideFound = useStore((s) => s.setHideFound)
  const [query, setQuery] = useState('')

  const progress = useMemo(() => computeProgress(data.locations, data.groups, found, regionId), [data, found, regionId])
  const pct = percent(progress.overall)

  return (
    <aside className="sidebar">
      <header className="brand">
        <div className="brand-row">
          <h1>
            Pywel <span>Crimson Desert</span>
          </h1>
          <select className="region" value={regionId ?? ''} onChange={(e) => setRegion(e.target.value ? Number(e.target.value) : null)} aria-label="Region">
            <option value="">All regions</option>
            {data.regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <div className="overall">
          <div className="overall-bar" aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="overall-text">
            <strong>{progress.overall.found.toLocaleString()}</strong> of {progress.overall.total.toLocaleString()} found · {formatPercent(pct)}
          </span>
        </div>
      </header>

      <SearchBox query={query} onQueryChange={setQuery} inputRef={searchRef} />

      <div className="sidebar-scroll">
        {query.trim() ? (
          <SearchResults key={query} query={query} onQueryChange={setQuery} inputRef={searchRef} />
        ) : (
          <>
            <div className="toolbar">
              <label className="switch">
                <input type="checkbox" checked={hideFound} onChange={(e) => setHideFound(e.target.checked)} />
                <span>Hide found</span>
                <kbd>H</kbd>
              </label>
              <PresetMenu />
            </div>
            <FilterPanel progress={progress} />
          </>
        )}
      </div>

      <footer className="sidebar-foot">
        <button className="link-btn" onClick={onOpenImport}>
          Import / export progress
        </button>
        <span title={data.syncedAt}>Data synced {new Date(data.syncedAt).toLocaleDateString()}</span>
      </footer>
    </aside>
  )
}
