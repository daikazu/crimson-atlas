import { describe, expect, it } from 'vitest'
import { createSearch } from './searchIndex'
import { categories, locations } from '../test/fixtures'

describe('createSearch', () => {
  const search = createSearch(locations, categories)

  it('finds by title prefix', () => {
    expect(search('herna')[0]).toBe(100)
  })

  it('ranks title matches above description matches', () => {
    expect(search('chest')).toEqual([103, 101])
  })

  it('matches category names', () => {
    expect(search('armor')).toContain(102)
  })

  it('tolerates typos', () => {
    expect(search('watrfall')).toEqual([103])
  })

  it('returns nothing for an empty query', () => {
    expect(search('  ')).toEqual([])
  })
})
