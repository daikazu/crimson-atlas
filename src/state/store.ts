import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FoundMap } from './selectors'

export interface Preset {
  name: string
  hidden: number[]
}

interface PersistedState {
  found: FoundMap
  /** Hidden category ids — stored as hidden (not visible) so new categories default to shown. */
  hidden: number[]
  hideFound: boolean
  regionId: number | null
  collapsed: number[]
  presets: Preset[]
  /** Set once first-run defaults have been applied. */
  seeded: boolean
}

interface SessionState {
  selectedId: number | null
  /** Shown regardless of filters, e.g. after picking a search result. */
  revealedId: number | null
  /** Bumped whenever the map should fly to the selected location. */
  flyToken: number
}

interface Actions {
  seedDefaults: (hidden: number[]) => void
  toggleFound: (id: number) => void
  importFound: (ids: number[], mode: 'merge' | 'replace') => void
  setCategoriesVisible: (ids: number[], visible: boolean) => void
  soloCategories: (ids: number[], allIds: number[]) => void
  setHideFound: (v: boolean) => void
  setRegion: (id: number | null) => void
  toggleCollapsed: (groupId: number) => void
  savePreset: (name: string) => void
  applyPreset: (name: string) => void
  deletePreset: (name: string) => void
  select: (id: number | null, opts?: { fly?: boolean; reveal?: boolean }) => void
}

export type AppState = PersistedState & SessionState & Actions

const without = (list: number[], remove: number[]) => {
  const r = new Set(remove)
  return list.filter((x) => !r.has(x))
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      found: {},
      hidden: [],
      hideFound: false,
      regionId: null,
      collapsed: [],
      presets: [],
      seeded: false,
      selectedId: null,
      revealedId: null,
      flyToken: 0,

      seedDefaults: (hidden) => {
        if (!get().seeded) set({ hidden, seeded: true })
      },

      toggleFound: (id) =>
        set((s) => {
          const found = { ...s.found }
          if (found[id]) delete found[id]
          else found[id] = true
          return { found }
        }),

      importFound: (ids, mode) =>
        set((s) => {
          const found: FoundMap = mode === 'merge' ? { ...s.found } : {}
          for (const id of ids) found[id] = true
          return { found }
        }),

      setCategoriesVisible: (ids, visible) =>
        set((s) => ({ hidden: visible ? without(s.hidden, ids) : [...without(s.hidden, ids), ...ids] })),

      soloCategories: (ids, allIds) => set({ hidden: without(allIds, ids) }),

      setHideFound: (hideFound) => set({ hideFound }),

      setRegion: (regionId) => set({ regionId }),

      toggleCollapsed: (groupId) =>
        set((s) => ({ collapsed: s.collapsed.includes(groupId) ? without(s.collapsed, [groupId]) : [...s.collapsed, groupId] })),

      savePreset: (name) =>
        set((s) => ({ presets: [...s.presets.filter((p) => p.name !== name), { name, hidden: [...s.hidden] }] })),

      applyPreset: (name) => {
        const preset = get().presets.find((p) => p.name === name)
        if (preset) set({ hidden: [...preset.hidden] })
      },

      deletePreset: (name) => set((s) => ({ presets: s.presets.filter((p) => p.name !== name) })),

      select: (id, opts = {}) =>
        set((s) => ({
          selectedId: id,
          revealedId: opts.reveal ? id : id === null ? null : s.revealedId === id ? id : null,
          flyToken: opts.fly ? s.flyToken + 1 : s.flyToken,
        })),
    }),
    {
      name: 'crimson-desert-map',
      version: 1,
      partialize: ({ found, hidden, hideFound, regionId, collapsed, presets, seeded }): PersistedState => ({
        found,
        hidden,
        hideFound,
        regionId,
        collapsed,
        presets,
        seeded,
      }),
    },
  ),
)
