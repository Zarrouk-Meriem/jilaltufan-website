import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES, countryName, countryOptions, isCountryCode } from '@/lib/countries'

describe('countries', () => {
  it('names Palestine plainly in both languages, whatever ICU says', () => {
    expect(countryName('PS', 'ar')).toBe('فلسطين')
    expect(countryName('PS', 'en')).toBe('Palestine')
  })

  it('does not offer the occupying entity', () => {
    expect(isCountryCode('IL')).toBe(false)
    expect(countryOptions('ar').map((o) => o.value as string)).not.toContain('IL')
  })

  it('has unique, upper-case, two-letter codes', () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
    for (const c of COUNTRY_CODES) expect(c).toMatch(/^[A-Z]{2}$/)
  })

  it('resolves every code to a localised name, sorted for the locale', () => {
    for (const locale of ['ar', 'en'] as const) {
      const opts = countryOptions(locale)
      expect(opts).toHaveLength(COUNTRY_CODES.length)
      const collator = new Intl.Collator(locale)
      for (let i = 1; i < opts.length; i++)
        expect(collator.compare(opts[i - 1]!.label, opts[i]!.label)).toBeLessThanOrEqual(0)
      // ICU knows these; a bare code leaking through would mean a broken lookup.
      for (const o of opts) expect(o.label).not.toMatch(/^[A-Z]{2}$/)
    }
    expect(countryName('TN', 'ar')).toBe('تونس')
    expect(countryName('TN', 'en')).toBe('Tunisia')
  })

  it('falls back to the code for an unknown value instead of throwing', () => {
    expect(countryName('ZZ', 'en')).toBe('ZZ')
    expect(isCountryCode('zz')).toBe(false)
  })
})
