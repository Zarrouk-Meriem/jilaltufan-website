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
import { mediaImage } from '@/lib/media'
import { seasonRange, sessionsCountLabel, trackLabel } from '@/lib/program'

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
  const projects = programs.filter((p) => p.track === 'projects')

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
                image={mediaImage(p.coverImage, 'card')}
                description={p.shortDescription}
                trackLabel={t('home.openTrackLabel')}
                registration={registrationBadge(p.registrationMode, t)}
                sessionsLabel={sessionsCountLabel(p, t)}
                seasonLabel={seasonRange(p, t)}
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
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {directed.map((p, i) => (
                <ProgramCard
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  title={p.title}
                  image={mediaImage(p.coverImage, 'card')}
                  description={p.shortDescription}
                  ordinal={String(i + 1).padStart(2, '0')}
                  trackLabel={t('home.directedTrackLabel')}
                  registration={registrationBadge(p.registrationMode, t)}
                  sessionsLabel={sessionsCountLabel(p, t)}
                  seasonLabel={seasonRange(p, t)}
                  motif={p.accentMotif}
                />
              ))}
            </div>
          ) : (
            <EmptyState className="mt-10" title={t('common.comingSoon')} />
          )}
        </div>
      </section>

      {/* One strategic project: the card is the section, shown whole the way Open Training
          is. A heading above it repeated the card word for word (user report, 2026-09-26). */}
      {projects.length ? (
        <section className="container-site py-14 md:py-20">
          <h2 className="sr-only">{t('programs.projectsTitle')}</h2>
          <div className="grid gap-4">
            {projects.map((p, i) => (
              <ProgramCard
                key={p.id}
                featured
                href={`/programs/${p.slug}`}
                title={p.title}
                image={mediaImage(p.coverImage, 'card')}
                description={p.shortDescription}
                ordinal={projects.length > 1 ? String(i + 1).padStart(2, '0') : ordinalFor(2, t)}
                trackLabel={trackLabel(p.track, t)}
                registration={registrationBadge(p.registrationMode, t)}
                sessionsLabel={sessionsCountLabel(p, t)}
                seasonLabel={seasonRange(p, t)}
                featuredCta={t('common.readMore')}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-site py-14 hairline-t md:py-20">
        <SectionHeading
          locale={locale}
          size="md"
          ordinal={ordinalFor(projects.length ? 3 : 2, t)}
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
