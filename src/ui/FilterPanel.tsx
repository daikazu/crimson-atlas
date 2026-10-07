import { useEffect, useRef, useState } from 'react'
import type { Category, Group } from '../data/types'
import type { Progress, ProgressSummary } from '../state/selectors'
import { useStore } from '../state/store'
import { useData } from './DataContext'
import { SpriteIcon } from './SpriteIcon'

function Count({ p }: { p: Progress }) {
  return (
    <span className={`count ${p.total > 0 && p.found === p.total ? 'is-complete' : ''}`}>
      {p.found}
      <span className="count-sep">/</span>
      {p.total}
    </span>
  )
}

function TriCheckbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate: boolean; onChange: (v: boolean) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
}

export function FilterPanel({ progress }: { progress: ProgressSummary }) {
  const { data, categoryById, allCategoryIds } = useData()
  const hidden = useStore((s) => s.hidden)
  const collapsed = useStore((s) => s.collapsed)
  const setVisible = useStore((s) => s.setCategoriesVisible)
  const solo = useStore((s) => s.soloCategories)
  const toggleCollapsed = useStore((s) => s.toggleCollapsed)
  const [text, setText] = useState('')

  const hiddenSet = new Set(hidden)
  const needle = text.trim().toLowerCase()
  const matches = (c: Category, g: Group) => !needle || c.title.toLowerCase().includes(needle) || g.title.toLowerCase().includes(needle)

  return (
    <div className="filters">
      <div className="filters-head">
        <input className="filter-text" placeholder="Filter categories" value={text} onChange={(e) => setText(e.target.value)} aria-label="Filter categories" />
        <button className="link-btn" onClick={() => setVisible(allCategoryIds, true)}>
          All
        </button>
        <button className="link-btn" onClick={() => setVisible(allCategoryIds, false)}>
          None
        </button>
      </div>
      <p className="hint">
        <kbd>Alt</kbd>-click a category to show only that one.
      </p>

      {data.groups.map((g) => {
        const cats = g.categoryIds.map((id) => categoryById.get(id)!).filter((c) => matches(c, g))
        if (cats.length === 0) return null
        const visibleCount = g.categoryIds.filter((id) => !hiddenSet.has(id)).length
        const isOpen = needle !== '' || !collapsed.includes(g.id)
        return (
          <section key={g.id} className="group" style={{ '--group-color': `#${g.color}` } as React.CSSProperties}>
            <header className="group-head">
              <TriCheckbox
                checked={visibleCount === g.categoryIds.length}
                indeterminate={visibleCount > 0 && visibleCount < g.categoryIds.length}
                onChange={(v) => setVisible(g.categoryIds, v)}
                label={`Show ${g.title}`}
              />
              <button className="group-toggle" onClick={() => toggleCollapsed(g.id)} aria-expanded={isOpen}>
                <span className={`chevron ${isOpen ? 'is-open' : ''}`} aria-hidden>
                  ▸
                </span>
                <span className="group-title">{g.title}</span>
                <Count p={progress.byGroup.get(g.id)!} />
              </button>
            </header>
            {isOpen && (
              <ul className="cats">
                {cats.map((c) => {
                  const p = progress.byCategory.get(c.id)!
                  const visible = !hiddenSet.has(c.id)
                  return (
                    <li key={c.id} className={`cat ${visible ? '' : 'is-hidden'}`}>
                      <label
                        title={c.info ?? undefined}
                        onClick={(e) => {
                          if (e.altKey) {
                            e.preventDefault()
                            solo([c.id], allCategoryIds)
                          }
                        }}
                      >
                        <input type="checkbox" checked={visible} onChange={(e) => setVisible([c.id], e.target.checked)} />
                        <SpriteIcon icon={c.icon} height={26} />
                        <span className="cat-title">{c.title}</span>
                        <Count p={p} />
                      </label>
                      <button className="only-btn" onClick={() => solo([c.id], allCategoryIds)} title={`Show only ${c.title}`}>
                        only
                      </button>
                      <span className="bar" aria-hidden>
                        <span style={{ width: `${p.total ? (p.found / p.total) * 100 : 0}%` }} />
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
