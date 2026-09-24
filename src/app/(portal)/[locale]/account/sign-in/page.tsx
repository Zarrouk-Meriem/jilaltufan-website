import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/forms/AccountForms'
import { PortalShell } from '@/components/portal/PortalShell'
import { PageOpening } from '@/components/portal/pieces'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAccount } from '@/lib/auth/account'
import { signIn } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/sign-in'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('signInTitle')), robots: { index: false, follow: false } }
}

export default async function SignInPage({ params }: PageProps<'/[locale]/account/sign-in'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('account')

  // Already signed in: the sign-in page has nothing to offer them.
  if (await getAccount()) redirect(`/${locale}/account`)

  return (
    <PortalShell locale={locale}>
      <PageOpening title={t('signInTitle')} intro={t('signInIntro')} />
      <SignInForm action={signIn} />
    </PortalShell>
  )
}
