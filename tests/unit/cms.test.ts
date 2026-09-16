import { describe, expect, it } from 'vitest'
import { listOr, textOr } from '@/lib/cms'

describe('CMS fallbacks', () => {
  it('textOr keeps editor text and falls back on empty, blank, null, undefined', () => {
    expect(textOr('نص', 'x')).toBe('نص')
    expect(textOr('', 'x')).toBe('x')
    expect(textOr('   ', 'x')).toBe('x')
    expect(textOr(null, 'x')).toBe('x')
    expect(textOr(undefined, 'x')).toBe('x')
  })
  it('listOr keeps a non-empty list and falls back otherwise', () => {
    expect(listOr([1], [2])).toEqual([1])
    expect(listOr([], [2])).toEqual([2])
    expect(listOr(null, [2])).toEqual([2])
    expect(listOr(undefined, [2])).toEqual([2])
  })
})
