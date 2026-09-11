import { describe, expect, it } from 'vitest'
import { parseAccent, stripAccent } from '@/lib/accent'

describe('parseAccent', () => {
  it('returns a single plain segment when there is no markup', () => {
    expect(parseAccent('بالعلم نتحرّر')).toEqual([{ text: 'بالعلم نتحرّر', accent: false }])
  })
  it('splits around the first **word**', () => {
    expect(parseAccent('بالعلم **نتحرّر**')).toEqual([
      { text: 'بالعلم ', accent: false },
      { text: 'نتحرّر', accent: true },
    ])
  })
  it('honours only the first pair and strips later stars', () => {
    expect(parseAccent('**a** b **c**')).toEqual([
      { text: 'a', accent: true },
      { text: ' b c', accent: false },
    ])
  })
  it('strips stray stars from unpaired input', () => {
    expect(parseAccent('a ** b')).toEqual([{ text: 'a  b', accent: false }])
  })
})

describe('stripAccent', () => {
  it('removes all markup', () => {
    expect(stripAccent('Through knowledge, we are **liberated**')).toBe(
      'Through knowledge, we are liberated',
    )
  })
})
