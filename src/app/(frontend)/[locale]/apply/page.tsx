import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplySection } from '@/components/forms/ApplySection'
import { PageIntro } from '@/components/sections/PageIntro'
import { FlagStyles } from '@/components/ui/FlagStyles'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { countryOptions } from '@/lib/countries'
import { dialOptions } from '@/lib/dial-codes'
import { submitApplication } from './actions'

/**
 * One application for the whole academy: a visitor applies once, and the program
 * is chosen after acceptance (staff set it on the record). No program chooser here.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/apply'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'apply' })
  return {
    alternates: alternatesFor(locale as Locale, '/apply'),
    title: stripAccent(t('title')),
    description: t('intro'),
  }
}

export default async function ApplyPage({ params }: PageProps<'/[locale]/apply'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  return (
    <>
      <FlagStyles />
      <PageIntro
        locale={locale}
        title={t('apply.title')}
        intro={t('apply.intro')}
        ordinal={t('nav.apply')}
      />
      <div className="container-reading py-14 md:py-20">
        <ApplySection
          locale={locale}
          action={submitApplication}
          countries={countryOptions(locale)}
          dialCodes={dialOptions(locale)}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
        />
      </div>
    </>
  )
}
