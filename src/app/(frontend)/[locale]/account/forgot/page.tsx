import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ForgotForm } from '@/components/forms/AccountForms'
import { PageIntro } from '@/components/sections/PageIntro'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { requestReset } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/forgot'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('forgot.title')), robots: { index: false, follow: false } }
}

export default async function ForgotPage({ params }: PageProps<'/[locale]/account/forgot'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <>
      <PageIntro locale={locale} title={t('forgot.title')} intro={t('forgot.intro')} />
      <div className="container-site py-14 md:py-20">
        <div className="max-w-md">
          <ForgotForm action={requestReset} />
        </div>
      </div>
    </>
  )
}
