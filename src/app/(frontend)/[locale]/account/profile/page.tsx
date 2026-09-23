import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { ChangePasswordForm, ProfileForm } from '@/components/forms/AccountForms'
import { PageIntro } from '@/components/sections/PageIntro'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAccount } from '@/lib/auth/account'
import { ordinalFor } from '@/lib/view'
import { changePassword, updateProfile } from '../actions'

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
      <PageIntro
        locale={locale}
        title={t('account.profile.title')}
        intro={t('account.profile.intro')}
      />
      <div className="container-site flex flex-col gap-16 py-14 md:py-20">
        <section className="max-w-md">
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(0, t)}
            title={t('account.profile.detailsTitle')}
          />
          <div className="mt-8">
            <ProfileForm
              action={updateProfile}
              name={account.name ?? ''}
              accountLocale={account.locale === 'en' ? 'en' : 'ar'}
              email={account.email}
            />
          </div>
        </section>

        <section className="max-w-md">
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(1, t)}
            title={t('account.profile.passwordTitle')}
          />
          <div className="mt-8">
            <ChangePasswordForm action={changePassword} />
          </div>
        </section>

        <p>
          <TextLink href="/account">{t('account.profile.back')}</TextLink>
        </p>
      </div>
    </>
  )
}
