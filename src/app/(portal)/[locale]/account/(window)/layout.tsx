import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { PortalShell } from '@/components/portal/PortalShell'
import type { PortalNavItem } from '@/components/portal/PortalNav'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { signOut } from '../actions'

/**
 * The window's own shell, around every signed-in page.
 *
 * The door pages (`sign-in`, `forgot`, `set-password`) sit outside this group on purpose:
 * they share the portal's root layout but must not be behind its guard, or asking for a
 * password would need a password. A route group gives them that without changing a URL.
 */
export default async function WindowLayout({ children, params }: LayoutProps<'/[locale]/account'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('account')

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  const student: PortalNavItem[] = [
    { href: '/account', label: t('nav.overview') },
    { href: '/account/application', label: t('nav.application') },
    { href: '/account/sessions', label: t('nav.sessions') },
    { href: '/account/materials', label: t('nav.materials') },
    { href: '/account/profile', label: t('nav.profile') },
  ]
  const instructor: PortalNavItem[] = [
    { href: '/account', label: t('nav.overview') },
    { href: '/account/sessions', label: t('nav.sessions') },
    { href: '/account/materials', label: t('nav.sentMaterials') },
    { href: '/account/profile', label: t('nav.profile') },
  ]

  const signOutHere = signOut.bind(null, locale === 'en' ? 'en' : 'ar')

  return (
    <PortalShell
      locale={locale}
      nav={account.kind === 'instructor' ? instructor : student}
      person={{
        name: account.name || account.email,
        role: t(`kind.${account.kind === 'instructor' ? 'instructor' : 'student'}`),
      }}
      signOut={
        <form action={signOutHere}>
          <button
            type="submit"
            className="rounded-brand text-sm font-medium text-on-navy/70 transition-colors duration-150 ease-brand hover:text-on-navy"
          >
            {t('signOut')}
          </button>
        </form>
      }
    >
      {children}
    </PortalShell>
  )
}
