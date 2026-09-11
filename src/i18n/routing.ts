import { defineRouting } from 'next-intl/routing'

/**
 * Adding a locale: add it here, in `payload.config.ts` → localization.locales,
 * and create `messages/<code>.json`. Nothing else should need to change.
 */
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]

export const localeMeta: Record<Locale, { dir: 'rtl' | 'ltr'; label: string; htmlLang: string }> = {
  ar: { dir: 'rtl', label: 'العربية', htmlLang: 'ar' },
  en: { dir: 'ltr', label: 'English', htmlLang: 'en' },
}
