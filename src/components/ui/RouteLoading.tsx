'use client'

import { useTranslations } from 'next-intl'
import { Loader } from '@/components/ui/Loader'

/**
 * Route loading state, re-exported from a segment's `loading.tsx`. Only segments
 * that never call `notFound()` get one: a loading boundary above a not-found page
 * streams the shell with a 200 before the 404 is known, which turns hard 404s
 * (the catch-all, unknown slugs) into soft ones.
 *
 * A client leaf on purpose. `loading.tsx` receives no `params`, so it cannot call
 * `setRequestLocale`; a server-side `getTranslations()` here would read the locale
 * from the request instead and Next would then render the whole segment on demand
 * (`ƒ`, `Cache-Control: no-store`) rather than prerender it. `useTranslations`
 * takes the locale from the layout's `NextIntlClientProvider`, which keeps the
 * route static (found 2026-09-20 by the Lighthouse re-measure).
 *
 * At least viewport-tall on purpose. Even on a prerendered route the HTML carries
 * this fallback first and streams the page in after it; on a slow device the
 * browser paints the fallback with the footer right under it, and the footer then
 * jumps when the content lands (a 0.30 layout shift on the home page). With the
 * fallback filling the viewport the footer is never in view during the swap.
 */
export function RouteLoading() {
  const t = useTranslations('common')
  return (
    <div className="route-loading container-site flex min-h-dvh items-center justify-center py-20">
      <Loader size="lg" label={t('loading')} />
    </div>
  )
}
