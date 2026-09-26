import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LegalText } from '@/components/content/LegalText'
import { PageIntro } from '@/components/sections/PageIntro'
import type { Locale } from '@/i18n/routing'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })
  return {
    alternates: alternatesFor(locale as Locale, '/terms'),
    title: t('title'),
    description: t('description'),
  }
}

export default async function LegalPage({ params }: PageProps<'/[locale]/terms'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('terms')
  return (
    <>
      <PageIntro locale={locale} title={t('title')} />
      <div className="container-reading py-14 md:py-20">
        <LegalText
          updatedLabel={t('updatedLabel')}
          updated={t('updated')}
          intro={t.raw('intro') as string[]}
          sections={t.raw('sections') as { h: string; body: string[] }[]}
          pending={t('pending') || undefined}
          pendingLink={{ href: '/terms', locale: 'ar', label: t('pendingLink') }}
        />
      </div>
    </>
  )
}
