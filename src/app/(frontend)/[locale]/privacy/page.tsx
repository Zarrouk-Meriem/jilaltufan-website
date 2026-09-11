import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageIntro } from '@/components/sections/PageIntro'
import { Callout } from '@/components/ui/Callout'
import type { Locale } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/queries'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  return { title: t('title') }
}

export default async function LegalPage({ params }: PageProps<'/[locale]/privacy'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('privacy')
  const settings = await getSiteSettings(locale)
  const sections = t.raw('sections') as { h: string; p: string[] }[]
  return (
    <>
      <PageIntro locale={locale} title={t('title')} />
      <div className="container-reading py-14 md:py-20">
        <Callout className="mb-12">
          <p>{t('draftNote')}</p>
        </Callout>
        <div className="flex flex-col gap-12">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg">{s.h}</h2>
              {s.p.map((p, j) => (
                <p key={j} className="mt-4 measure text-ink-700">
                  {p.replace('{email}', settings.contactEmail)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
