import { useEffect, useRef, useState } from 'react'
import { useMapData } from './data/useMapData'
import { desktop } from './desktop'
import { MapView } from './map/MapView'
import { useStore } from './state/store'
import { DataProvider, useData } from './ui/DataContext'
import { DetailPanel } from './ui/DetailPanel'
import { ImportDialog } from './ui/ImportDialog'
import { Sidebar } from './ui/Sidebar'
import { UpdateBanner } from './ui/UpdateBanner'
import { useHashSelection, useHotkeys } from './ui/useHotkeys'

export default function App() {
  const state = useMapData()
  if (state.status === 'loading') return <div className="splash">Loading Pywel…</div>
  if (state.status === 'downloading')
    return (
      <div className="splash">
        <div>
          Downloading map data…
          <p className="splash-sub">Fetching the latest locations from MapGenie. This only happens on first launch.</p>
        </div>
      </div>
    )
  if (state.status === 'error')
    return (
      <div className="splash splash-error">
        <div>
          <p>Couldn't load the map data.</p>
          <p className="splash-sub">{state.error.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')}</p>
          <button className="retry" onClick={state.retry}>
            Try again
          </button>
        </div>
      </div>
    )
  return (
    <DataProvider data={state.data} sprite={state.sprite}>
      <Shell />
    </DataProvider>
  )
}

function Shell() {
  const { data } = useData()
  const searchRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const hasSelection = useStore((s) => s.selectedId !== null)
  useHotkeys(searchRef)
  useHashSelection()

  useEffect(() => desktop?.onOpenImport(() => setImportOpen(true)), [])

  // First run: 28 resource categories would bury everything else, so start with them off.
  useEffect(() => {
    const resources = data.groups.find((g) => g.title === 'Resources')
    useStore.getState().seedDefaults(resources?.categoryIds ?? [])
  }, [data])

  return (
    <div className={`shell ${hasSelection ? 'has-detail' : ''}`}>
      <Sidebar searchRef={searchRef} onOpenImport={() => setImportOpen(true)} />
      <main className="map-wrap">
        <MapView data={data} />
        <UpdateBanner />
      </main>
      <DetailPanel />
      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} />}
    </div>
  )
}
