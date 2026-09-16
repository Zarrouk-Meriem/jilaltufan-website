import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageIntro } from '@/components/sections/PageIntro'
import { ProgramCard } from '@/components/sections/ProgramCard'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { listPrograms } from '@/lib/queries'
import { registrationBadge } from '@/lib/view'
import { mediaImage } from '@/lib/media'
import { seasonRange, sessionsCountLabel, trackLabel } from '@/lib/program'

export const revalidate = 300

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

export default async function ApplyIndexPage({ params }: PageProps<'/[locale]/apply'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const programs = await listPrograms(locale)
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('apply.title')}
        intro={t('apply.intro')}
        ordinal={t('nav.apply')}
      />
      <div className="container-site py-14 md:py-20">
        <h2 className="mb-8 text-lg">{t('apply.chooseProgram')}</h2>
        {programs.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((p, i) => (
              <ProgramCard
                key={p.id}
                href={`/apply/${p.slug}`}
                title={p.title}
                image={mediaImage(p.coverImage, 'card')}
                description={p.shortDescription}
                ordinal={String(i + 1).padStart(2, '0')}
                trackLabel={trackLabel(p.track, t)}
                registration={registrationBadge(p.registrationMode, t)}
                sessionsLabel={sessionsCountLabel(p, t)}
                seasonLabel={seasonRange(p, t)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={t('common.comingSoon')} />
        )}
      </div>
    </>
  )
}
