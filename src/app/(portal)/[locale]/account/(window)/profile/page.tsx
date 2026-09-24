import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { ChangePasswordForm, ProfileForm } from '@/components/forms/AccountForms'
import { Card, PageOpening } from '@/components/portal/pieces'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAccount } from '@/lib/auth/account'
import { changePassword, updateProfile } from '../../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/profile'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('profile.title')), robots: { index: false, follow: false } }
}

/**
 * What a student may change about themselves: the name we call them by, the language we
 * write to them in, and their password. Their application stays as they submitted it — a
 * record of what was sent, not a form to edit later.
 */
export default async function ProfilePage({ params }: PageProps<'/[locale]/account/profile'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  return (
    <>
      <PageOpening title={t('account.profile.title')} intro={t('account.profile.intro')} />
      <div className="flex flex-col gap-5">
        <Card title={t('account.profile.detailsTitle')}>
          <ProfileForm
            action={updateProfile}
            name={account.name ?? ''}
            accountLocale={account.locale === 'en' ? 'en' : 'ar'}
            email={account.email}
          />
        </Card>
        <Card title={t('account.profile.passwordTitle')}>
          <ChangePasswordForm action={changePassword} />
        </Card>
      </div>
    </>
  )
}
