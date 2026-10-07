import MiniSearch from 'minisearch'
import type { Category, Location } from '../data/types'

const stripMarkdown = (md: string) =>
  md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>~-]+/g, ' ')

/** Builds a fuzzy, prefix-matching index; returns a query function that yields ranked location ids. */
export function createSearch(locations: Location[], categories: Category[]) {
  const categoryTitle = new Map(categories.map((c) => [c.id, c.title]))
  const index = new MiniSearch<{ id: number; title: string; category: string; description: string }>({
    fields: ['title', 'category', 'description'],
    searchOptions: {
      boost: { title: 4, category: 2 },
      prefix: true,
      fuzzy: (term) => (term.length > 3 ? 0.2 : false),
      combineWith: 'AND',
    },
  })
  index.addAll(
    locations.map((l) => ({
      id: l.id,
      title: l.title,
      category: categoryTitle.get(l.categoryId) ?? '',
      description: l.description ? stripMarkdown(l.description) : '',
    })),
  )

  return (query: string, limit = 60): number[] => {
    if (!query.trim()) return []
    return index
      .search(query)
      .slice(0, limit)
      .map((r) => r.id as number)
  }
}
