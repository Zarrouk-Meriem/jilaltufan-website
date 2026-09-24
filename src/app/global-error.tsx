'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ErrorState, type ErrorCopy } from '@/components/layout/ErrorState'
import { localeMeta, routing, type Locale } from '@/i18n/routing'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

/**
 * When a root layout itself fails (it reads Site settings, so a database outage lands
 * here), Next replaces the whole document with this. Nothing above it runs: no intl
 * provider, no header or footer. It sets its own `<html lang dir>` from the path, and
 * fetches only its locale's messages, only once an error has happened — importing the
 * files statically would put both locales' strings (78 kB) in every page's bundle.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const first = usePathname()?.split('/')[1]
  const locale: Locale = routing.locales.includes(first as Locale)
    ? (first as Locale)
    : routing.defaultLocale
  const meta = localeMeta[locale]
  const [copy, setCopy] = useState<ErrorCopy | null>(null)

  useEffect(() => {
    let live = true
    import(`../../messages/${locale}.json`).then(({ default: m }) => {
      if (!live) return
      const e = m.error as Record<'title' | 'body' | 'retry' | 'home' | 'reference', string>
      setCopy({
        title: e.title,
        body: e.body,
        retry: e.retry,
        home: e.home,
        reference: error.digest ? e.reference.replace('{digest}', error.digest) : undefined,
      })
    })
    return () => {
      live = false
    }
  }, [locale, error.digest])

  return (
    <html lang={meta.htmlLang} dir={meta.dir} className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <main id="main" className="flex-1">
          {copy ? <ErrorState copy={copy} homeHref={`/${locale}`} onRetry={retry} /> : null}
        </main>
      </body>
    </html>
  )
}
