import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode as PhoneCountry,
} from 'libphonenumber-js/min'
import { COUNTRY_CODES, countryName, type CountryCode } from './countries'

/**
 * Country calling codes and number handling come from libphonenumber (Google's
 * metadata, the `min` build): no hand-kept table, real validation, and formatting
 * as the visitor types. Flags are `.fi-xx` classes keyed by the lower-case ISO code.
 */
export type DialOption = {
  value: CountryCode
  label: string
  short: string
  display: string
  flag: string
}

const cache = new Map<'ar' | 'en', DialOption[]>()

/** One row per country, sorted by the localised name; `short` is what the closed control shows. */
export function dialOptions(locale: 'ar' | 'en'): DialOption[] {
  let list = cache.get(locale)
  if (!list) {
    const collator = new Intl.Collator(locale)
    list = COUNTRY_CODES.flatMap((value) => {
      let code: string
      try {
        code = getCountryCallingCode(value as PhoneCountry)
      } catch {
        return [] // not a dialling territory in the metadata
      }
      const short = `+${code}`
      return [
        {
          value,
          label: `${countryName(value, locale)} ${short}`,
          short,
          display: short,
          flag: value.toLowerCase(),
        },
      ]
    }).sort((a, b) => collator.compare(a.label, b.label))
    cache.set(locale, list)
  }
  return list
}

/** Digits in any script (Arabic-Indic, Persian) become 0–9. */
export function latinDigits(raw: string) {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
}

/** Digits in any script become 0–9; everything but + and digits goes. */
export function normalizePhone(raw: string) {
  return latinDigits(raw).replace(/[^\d+]/g, '')
}

/** The national number as the visitor types it, grouped the way that country writes numbers. */
export function formatNational(input: string, country: string) {
  const digits = latinDigits(input).replace(/[^\d]/g, '')
  if (!digits) return ''
  try {
    return new AsYouType(country as PhoneCountry).input(digits)
  } catch {
    return digits
  }
}

/** An E.164 value back into its country and national digits (a restored draft). */
export function splitE164(e164: string): { country: string; national: string } | null {
  try {
    const p = parsePhoneNumberFromString(e164)
    return p?.country ? { country: p.country, national: p.nationalNumber } : null
  } catch {
    return null
  }
}

/** The stored form: E.164 (`+21620000000`), or '' while the number is not parseable. */
export function toE164(national: string, country: string) {
  const digits = latinDigits(national).replace(/[^\d]/g, '')
  if (!digits || !country) return ''
  try {
    return parsePhoneNumberFromString(digits, country as PhoneCountry)?.number ?? ''
  } catch {
    return ''
  }
}
