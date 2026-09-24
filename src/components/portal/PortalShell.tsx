import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/Logo'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { PortalNav, type PortalNavItem } from './PortalNav'

/**
 * The portal's chrome, and the whole reason this route group exists.
 *
 * A signed-in student was being shown the marketing header — five nav items and a «قدّم
 * الآن» button aimed at someone who has not applied yet — which read as though they had
 * been dropped back onto the public site. Everything personal lives here instead: its own
 * root layout, its own navigation, no footer.
 *
 * Two shapes. With `nav`, a navy rail on the wide frame and a navy bar with a scrolling row
 * on a narrow one. Without it — signing in, choosing a password, following an application —
 * a single centred column under the same bar, because those pages have nowhere to navigate
 * to yet.
 */
export async function PortalShell({
  locale,
  nav,
  person,
  signOut,
  children,
}: {
  locale: Locale
  nav?: PortalNavItem[]
  person?: { name: string; role: string }
  signOut?: ReactNode
  children: ReactNode
}) {
  const t = await getTranslations()
  const home = (
    <Link href="/" aria-label={t('a11y.logoHome')} className="inline-flex shrink-0 items-center">
      {/* Above the fold on every portal page, and Next measures it as the LCP. */}
      <Logo locale={locale} surface="dark" height={locale === 'ar' ? 40 : 32} priority />
    </Link>
  )

  if (!nav)
    return (
      <div className="flex min-h-dvh flex-col bg-paper-2">
        <header className="bg-navy-900 px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            {home}
            <LanguageSwitch label={t('a11y.switchLanguage')} tone="onNavy" />
          </div>
        </header>
        <main id="main" className="flex flex-1 items-start justify-center px-6 py-14 md:py-20">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    )

  return (
    <div className="flex min-h-dvh flex-col bg-paper-2 lg:flex-row">
      {/* The rail: only from `lg`, where a fixed column costs the content nothing. */}
      <aside
        data-portal-rail
        className="hidden shrink-0 bg-navy-900 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:flex-col lg:gap-8 lg:p-6"
      >
        {home}
        {person ? (
          <div className="min-w-0">
            <p className="truncate text-md font-semibold text-on-navy">{person.name}</p>
            <p className="text-xs font-medium text-on-navy/70">{person.role}</p>
          </div>
        ) : null}
        <PortalNav items={nav} className="-ms-4 flex-1" />
        <div className="flex flex-col gap-4 border-t border-white/15 pt-5">
          <LanguageSwitch label={t('a11y.switchLanguage')} tone="onNavy" />
          {signOut}
        </div>
      </aside>

      {/* The bar: the same content folded onto two rows for a narrow frame. */}
      <header className="bg-navy-900 px-5 pt-4 pb-1 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          {home}
          <div className="flex items-center gap-4">
            <LanguageSwitch label={t('a11y.switchLanguage')} tone="onNavy" />
            {signOut}
          </div>
        </div>
        {person ? (
          <p className="mt-3 truncate text-sm font-semibold text-on-navy">{person.name}</p>
        ) : null}
        <PortalNav items={nav} orientation="horizontal" className="-mx-3 mt-2" />
      </header>

      <main id="main" className="min-w-0 flex-1 px-5 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  )
}
