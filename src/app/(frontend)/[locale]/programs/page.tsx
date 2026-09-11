import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageIntro } from '@/components/sections/PageIntro'
import { ProgramCard } from '@/components/sections/ProgramCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { listPrograms } from '@/lib/queries'
import { ordinalFor, registrationBadge } from '@/lib/view'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/programs'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'programs' })
  return {
    alternates: alternatesFor(locale as Locale, '/programs'),
    title: stripAccent(t('title')),
    description: t('intro'),
  }
}

export default async function ProgramsPage({ params }: PageProps<'/[locale]/programs'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const programs = await listPrograms(locale)
  const open = programs.filter((p) => p.track === 'open')
  const directed = programs.filter((p) => p.track === 'directed')

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('programs.title')}
        intro={t('programs.intro')}
        ordinal={t('nav.programs')}
      />

      {open.length ? (
        <section className="container-site py-14 md:py-20">
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(0, t)}
            title={t('programs.openTitle')}
            intro={t('programs.openIntro')}
          />
          <div className="mt-10 grid gap-4">
            {open.map((p) => (
              <ProgramCard
                key={p.id}
                featured
                href={`/programs/${p.slug}`}
                title={p.title}
                description={p.shortDescription}
                trackLabel={t('home.openTrackLabel')}
                registration={registrationBadge(p.registrationMode, t)}
                sessionsLabel={t('program.sessionsCount')}
                seasonLabel={t('program.sepToApr')}
                featuredCta={t('common.readMore')}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-paper-2">
        <div className="container-site py-14 md:py-20">
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(1, t)}
            title={t('programs.directedTitle')}
            intro={t('programs.directedIntro')}
          />
          {directed.length ? (
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              {directed.map((p, i) => (
                <ProgramCard
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  title={p.title}
                  description={p.shortDescription}
                  ordinal={String(i + 1).padStart(2, '0')}
                  trackLabel={t('home.directedTrackLabel')}
                  registration={registrationBadge(p.registrationMode, t)}
                  sessionsLabel={t('program.sessionsCount')}
                  seasonLabel={t('program.sepToApr')}
                  motif={p.accentMotif}
                  className={i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}
                />
              ))}
            </div>
          ) : (
            <EmptyState className="mt-10" title={t('common.comingSoon')} />
          )}
        </div>
      </section>

      <section className="container-site py-14 md:py-20">
        <SectionHeading
          locale={locale}
          size="md"
          ordinal={ordinalFor(2, t)}
          title={t('programs.howItWorks')}
        />
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {(['step1', 'step2', 'step3'] as const).map((k, i) => (
            <li key={k} className="border-t border-line pt-5">
              <span className="text-sm text-red-700 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 text-md text-ink-900">{t(`programs.${k}`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
