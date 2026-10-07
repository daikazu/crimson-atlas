import { describe, expect, it } from 'vitest'
import { rewriteLocationLinks } from './markdown'

describe('rewriteLocationLinks', () => {
  it('turns MapGenie location links into in-app hash links', () => {
    const md = '- [The Unreachable Village](https://mapgenie.io/crimson-desert/maps/pywel?locationIds=544399)'
    expect(rewriteLocationLinks(md)).toBe('- [The Unreachable Village](#loc=544399)')
  })

  it('leaves other links alone', () => {
    const md = '[wiki](https://example.com/page)'
    expect(rewriteLocationLinks(md)).toBe(md)
  })
})
