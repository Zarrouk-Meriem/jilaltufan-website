import { getTranslations } from 'next-intl/server'
import { Header } from './Header'

/** Server wrapper: resolves translations, hands plain props to the client Header. */
export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations()
  return (
    <Header
      locale={locale}
      primary={[
        { href: '/about', label: t('nav.academy') },
        { href: '/programs', label: t('nav.programs') },
        { href: '/schedule', label: t('nav.schedule') },
        { href: '/knowledge', label: t('nav.knowledge') },
        { href: '/events', label: t('nav.events') },
      ]}
      utility={[
        { href: '/students', label: t('nav.students') },
        { href: '/instructors', label: t('nav.instructors') },
      ]}
      apply={{ href: '/apply', label: t('nav.apply') }}
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
