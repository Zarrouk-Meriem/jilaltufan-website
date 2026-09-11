import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageIntro } from '@/components/sections/PageIntro'
import { ProgramFilter } from '@/components/sections/ProgramFilter'
import { RefreshAtBoundary } from '@/components/sections/RefreshAtBoundary'
import { SessionRow } from '@/components/sections/SessionRow'
import { Callout } from '@/components/ui/Callout'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getSiteSettings, listPrograms, listSchedule } from '@/lib/queries'
import { formatInZone, monthKeyInZone } from '@/lib/time'
import { nextBoundaryMs, sessionView } from '@/lib/view'

export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/schedule'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'schedule' })
  return {
    alternates: alternatesFor(locale as Locale, '/schedule'),
    title: stripAccent(t('title')),
    description: t('intro'),
  }
}

export default async function SchedulePage({
  params,
  searchParams,
}: PageProps<'/[locale]/schedule'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const sp = await searchParams
  const programSlug = typeof sp.program === 'string' ? sp.program : undefined
  const t = await getTranslations()
  const now = new Date()
  const [settings, programs, sessions] = await Promise.all([
    getSiteSettings(locale),
    listPrograms(locale),
    listSchedule(locale, programSlug, now),
  ])
  const tz = settings.academyTimeZone
  const win = settings.joinWindowMinutes

  const upcoming = sessions.filter(
    (s) => new Date(s.startsAt).getTime() + (s.durationMinutes ?? 90) * 60_000 >= now.getTime(),
  )
  const groups = new Map<string, typeof upcoming>()
  for (const s of upcoming) {
    const k = monthKeyInZone(s.startsAt, tz)
    groups.set(k, [...(groups.get(k) ?? []), s])
  }

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('schedule.title')}
        intro={t('schedule.intro')}
        ordinal={t('nav.schedule')}
      >
        <div className="mt-8">
          <ProgramFilter
            label={t('schedule.filterLabel')}
            allLabel={t('schedule.allPrograms')}
            basePath="/schedule"
            current={programSlug}
            items={programs.map((p) => ({ slug: p.slug, title: p.title }))}
          />
        </div>
      </PageIntro>

      <div className="container-site py-14 md:py-20">
        <RefreshAtBoundary inMs={nextBoundaryMs(upcoming, win, now)} />
        <Callout className="mb-12 max-w-2xl">
          <p>
            {settings.joinLinkVisibility === 'email-only'
              ? t('schedule.joinEmailOnly')
              : t('schedule.joinNote', { minutes: win })}
          </p>
        </Callout>

        {groups.size ? (
          <div className="flex flex-col gap-16">
            {[...groups.entries()].map(([key, list]) => {
              const first = formatInZone(list[0]!.startsAt, locale, tz)
              return (
                <section key={key} aria-labelledby={`m-${key}`}>
                  <h2 id={`m-${key}`} className="text-lg">
                    {t('schedule.month', { month: first.month, year: first.year })}
                  </h2>
                  <div className="mt-4 divide-y divide-line border-y border-line">
                    {list.map((s) => {
                      const v = sessionView(s, locale, tz, win, t, now)
                      return (
                        <SessionRow
                          key={v.id}
                          locale={locale}
                          academyZone={tz}
                          iso={v.iso}
                          parts={v.parts}
                          state={v.state}
                          stateLabel={v.stateLabel}
                          programTitle={v.programTitle}
                          programHref={v.programHref}
                          title={v.title}
                          href={v.href}
                          instructor={v.instructor}
                          alQudsLabel={t('session.alQuds')}
                          localLabel={t('session.local')}
                          joinUrl={v.joinUrl}
                          joinLabel={t('session.joinNow')}
                          calendar={v.calendar}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <EmptyState title={programSlug ? t('schedule.emptyForProgram') : t('schedule.empty')} />
        )}
      </div>
    </>
  )
}
