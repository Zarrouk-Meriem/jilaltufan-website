import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getNavigation } from '@/lib/queries'
import { Header, type NavItem } from './Header'

const items = (rows: { label?: string | null; href?: string | null }[] | null | undefined) =>
  (rows ?? [])
    .filter((r): r is { label: string; href: string } => !!r.label?.trim() && !!r.href?.trim())
    .map((r) => ({ href: r.href, label: r.label }))

/**
 * Server wrapper: the Navigation global wins when an editor has filled it; the built-in
 * five-item menu is the fallback. Hands plain props to the client Header.
 */
export async function SiteHeader({ locale }: { locale: string }) {
  const [t, nav] = await Promise.all([getTranslations(), getNavigation(locale as Locale)])
  const defaults: { primary: NavItem[]; utility: NavItem[]; apply: NavItem } = {
    primary: [
      { href: '/about', label: t('nav.academy') },
      { href: '/programs', label: t('nav.programs') },
      { href: '/schedule', label: t('nav.schedule') },
      { href: '/knowledge', label: t('nav.knowledge') },
      { href: '/events', label: t('nav.events') },
    ],
    utility: [
      { href: '/students', label: t('nav.students') },
      { href: '/instructors', label: t('nav.instructors') },
      { href: '/account', label: t('nav.signIn') },
    ],
    apply: { href: '/apply', label: t('nav.apply') },
  }
  const primary = items(nav.primary)
  const utility = items(nav.utility)
  const cta = items(nav.cta ? [nav.cta] : [])[0]
  return (
    <Header
      locale={locale}
      primary={primary.length ? primary : defaults.primary}
      utility={utility.length ? utility : defaults.utility}
      apply={cta ?? defaults.apply}
      labels={{
        mainNav: t('a11y.mainNavigation'),
        utilityNav: t('a11y.utilityNavigation'),
        openMenu: t('a11y.openMenu'),
        closeMenu: t('a11y.closeMenu'),
        switchLanguage: t('a11y.switchLanguage'),
        logoHome: t('a11y.logoHome'),
      }}
    />
  )
}
