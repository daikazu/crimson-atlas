import { useEffect } from 'react'
import { useStore } from '../state/store'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

/** Global keys: / search · F toggle found · H hide found · Esc close. Lightbox/search handle their own keys. */
export function useHotkeys(searchInput: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (isTyping(e.target)) return
      const s = useStore.getState()
      switch (e.key) {
        case '/':
          e.preventDefault()
          searchInput.current?.focus()
          searchInput.current?.select()
          break
        case 'f':
        case 'F':
          if (s.selectedId !== null) s.toggleFound(s.selectedId)
          break
        case 'h':
        case 'H':
          s.setHideFound(!s.hideFound)
          break
        case 'Escape':
          s.select(null)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchInput])
}

/** Keeps `#loc=<id>` in the URL in sync with the selection, and follows in-app location links. */
export function useHashSelection() {
  const selectedId = useStore((s) => s.selectedId)

  useEffect(() => {
    const read = () => {
      const m = /^#loc=(\d+)$/.exec(window.location.hash)
      if (m) useStore.getState().select(Number(m[1]), { fly: true, reveal: true })
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  useEffect(() => {
    const hash = selectedId === null ? '' : `#loc=${selectedId}`
    if (window.location.hash !== hash) history.replaceState(null, '', hash || window.location.pathname)
  }, [selectedId])
}
