import { describe, expect, it } from 'vitest'
import { exportProgress, parseProgress } from './importProgress'

describe('parseProgress', () => {
  it('reads MapGenie user.locations ({id: true})', () => {
    expect(parseProgress('{"100001":true,"100002":true,"1":false}')).toEqual([100001, 100002])
  })

  it('reads the whole MapGenie user object', () => {
    expect(parseProgress('{"id":5,"locations":{"7":true}}')).toEqual([7])
  })

  it('reads a plain id array', () => {
    expect(parseProgress('[3, "4", 3]')).toEqual([3, 4])
  })

  it('reads this app’s own backup format', () => {
    expect(parseProgress(exportProgress({ 9: true, 8: true }))).toEqual([8, 9])
  })

  it('rejects input it cannot understand', () => {
    expect(() => parseProgress('not json')).toThrow(/JSON/)
    expect(() => parseProgress('{"foo":"bar"}')).toThrow(/location/)
  })
})
