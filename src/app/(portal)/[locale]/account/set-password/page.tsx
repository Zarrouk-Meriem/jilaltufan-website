import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SetPasswordForm } from '@/components/forms/AccountForms'
import { PortalShell } from '@/components/portal/PortalShell'
import { PageOpening } from '@/components/portal/pieces'
import { Callout } from '@/components/ui/Callout'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { setPassword } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/set-password'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('setPassword.title')), robots: { index: false, follow: false } }
}

/**
 * The end of an invite or a reset. The token stays in the query string and is never checked
 * on the way in: Payload consumes it when the password is submitted, and asking it twice
 * would only tell a visitor whether a token is real before they had to try.
 */
export default async function SetPasswordPage({
  params,
  searchParams,
}: PageProps<'/[locale]/account/set-password'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('account')
  const { token } = await searchParams
  const value = typeof token === 'string' ? token : ''

  return (
    <PortalShell locale={locale}>
      <PageOpening title={t('setPassword.title')} intro={t('setPassword.intro')} />
      {value ? (
        <SetPasswordForm token={value} action={setPassword} />
      ) : (
        <Callout title={t('setPassword.noTokenTitle')}>
          <p>{t('setPassword.noToken')}</p>
          <p className="mt-3">
            <TextLink href="/account/forgot">{t('setPassword.newLink')}</TextLink>
          </p>
        </Callout>
      )}
    </PortalShell>
  )
}
