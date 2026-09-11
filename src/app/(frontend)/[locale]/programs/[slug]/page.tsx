import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Prose } from '@/components/content/Prose'
import { PageIntro } from '@/components/sections/PageIntro'
import { Accordion } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LocalTime } from '@/components/ui/LocalTime'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import { routing, type Locale } from '@/i18n/routing'
import {
  getProgramBySlug,
  getSiteSettings,
  listProgramSlugs,
  listPrograms,
  listSessionsForProgram,
} from '@/lib/queries'
import { rels } from '@/lib/relations'
import { formatInZone } from '@/lib/time'
import { ordinalFor, registrationBadge, sessionView } from '@/lib/view'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await listProgramSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/programs/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getProgramBySlug(locale as Locale, slug)
  if (!p) return {}
  return {
    title: p.seo?.title || p.title,
    description: p.seo?.description || p.shortDescription || undefined,
  }
}

export default async function ProgramPage({ params }: PageProps<'/[locale]/programs/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const program = await getProgramBySlug(locale, slug)
  if (!program) notFound()
  const [settings, sessions, all] = await Promise.all([
    getSiteSettings(locale),
    listSessionsForProgram(locale, program.id),
    listPrograms(locale),
  ])
  const tz = settings.academyTimeZone
  const now = new Date()
  const badge = registrationBadge(program.registrationMode, t)
  const instructors = rels(program.instructors)
  const others = all.filter((p) => p.id !== program.id).slice(0, 3)
  const trackLabel = program.track === 'open' ? t('program.open') : t('program.directed')
  const canApply = program.registrationMode !== 'closed'

  const facts = [
    { k: t('program.track'), v: trackLabel },
    { k: t('program.sessions'), v: t('common.sessions', { count: program.sessionsCount ?? 8 }) },
    { k: t('program.season'), v: t('program.sepToApr') },
    { k: t('program.duration'), v: program.durationSummary || t('program.oneMonthly') },
  ]

  const items = sessions.map((s) => {
    const v = sessionView(s, locale, tz, settings.joinWindowMinutes, t, now)
    return {
      id: `session-${s.number}`,
      heading: (
        <span className="flex items-baseline gap-4">
          <span className="w-8 shrink-0 text-sm text-red-700 tabular-nums">
            {String(s.number).padStart(2, '0')}
          </span>
          <span>{s.title}</span>
        </span>
      ),
      meta: (
        <span className="ms-12 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {v.parts.dateTime} <span className="text-ink-500">· {t('session.alQuds')}</span>
          </span>
          <LocalTime iso={v.iso} locale={locale} academyZone={tz} label={t('session.local')} />
          {v.instructor ? <span>· {v.instructor}</span> : null}
          <Badge
            tone={
              v.state === 'live'
                ? 'live'
                : v.state === 'starting-soon'
                  ? 'accent'
                  : v.state === 'upcoming'
                    ? 'neutral'
                    : v.state === 'cancelled'
                      ? 'struck'
                      : 'muted'
            }
            pulse={v.state === 'live'}
          >
            {v.stateLabel}
          </Badge>
        </span>
      ),
      content: (
        <div className="ms-12 flex flex-col gap-5">
          {s.summary ? <p className="measure text-ink-900">{s.summary}</p> : null}
          <Prose data={s.details} />
          {s.materialsNote ? (
            <p className="measure text-sm text-ink-500">{s.materialsNote}</p>
          ) : null}
        </div>
      ),
    }
  })

  return (
    <>
      <PageIntro
        locale={locale}
        title={program.title}
        intro={program.shortDescription}
        ordinal={trackLabel}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[{ label: t('nav.programs'), href: '/programs' }, { label: program.title }]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          {program.registrationDeadline ? (
            <span className="text-sm text-ink-500">
              {t('program.deadline', {
                date: formatInZone(program.registrationDeadline, locale, tz).date,
              })}
            </span>
          ) : null}
        </div>
      </PageIntro>

      <div className="container-site grid gap-12 py-14 md:grid-cols-12 md:py-20">
        {/* Sticky side rail — start side on desktop */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="rounded-brand border border-line p-6 md:sticky md:top-28">
            <dl className="flex flex-col divide-y divide-line">
              {facts.map((f) => (
                <div key={f.k} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <dt className="text-ink-500">{f.k}</dt>
                  <dd className="text-end font-medium text-ink-900">{f.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col gap-3">
              {canApply ? (
                <ButtonLink href={`/apply/${program.slug}`} className="w-full">
                  {t('program.applyNow')}
                </ButtonLink>
              ) : (
                <>
                  <p className="text-sm text-ink-500">{t('program.registrationClosed')}</p>
                  <ButtonLink href="/contact" variant="secondary" className="w-full">
                    {t('program.contactUs')}
                  </ButtonLink>
                </>
              )}
              <TextLink href={`/schedule?program=${program.slug}`} className="self-start text-sm">
                {t('program.seeSchedule')}
              </TextLink>
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-20 md:col-span-8 lg:col-span-8 lg:col-start-5">
          {program.intro ? (
            <section>
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(0, t)}
                title={t('program.introTitle')}
              />
              <Prose data={program.intro} size="md" className="mt-8" />
            </section>
          ) : null}

          {program.goals?.length ? (
            <section>
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(1, t)}
                title={t('program.goalsTitle')}
              />
              <ol className="mt-8 flex flex-col divide-y divide-line border-y border-line">
                {program.goals.map((g, i) => (
                  <li key={g.id ?? i} className="flex gap-6 py-4">
                    <span className="w-8 shrink-0 text-sm text-red-700 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-md text-ink-900">{g.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {program.targetAudience ? (
            <section>
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(2, t)}
                title={t('program.audienceTitle')}
              />
              <Prose data={program.targetAudience} className="mt-8" />
            </section>
          ) : null}

          {program.durationSummary ? (
            <section>
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(3, t)}
                title={t('program.durationTitle')}
              />
              <p className="mt-8 measure text-md text-ink-900">{program.durationSummary}</p>
            </section>
          ) : null}

          <section id="sessions" className="scroll-mt-28">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(4, t)}
              title={t('program.sessionsTitle')}
              intro={t('program.sessionsIntro')}
            />
            <div className="mt-8">
              {items.length ? (
                <Accordion items={items} />
              ) : (
                <EmptyState title={t('program.noSessions')} />
              )}
            </div>
          </section>

          {instructors.length ? (
            <section>
              <SectionHeading locale={locale} size="md" title={t('program.instructor')} />
              <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {instructors.map((i) => (
                  <li key={i.id}>
                    <TextLink href={`/instructors/${i.slug}`}>{i.name}</TextLink>
                    {i.role ? <span className="ms-2 text-sm text-ink-500">{i.role}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {program.registrationNote ? (
            <section>
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(5, t)}
                title={t('program.registrationTitle')}
              />
              <Prose data={program.registrationNote} className="mt-8" />
            </section>
          ) : null}

          {others.length ? (
            <section className="border-t border-line pt-10">
              <p className="text-xs font-medium text-ink-500">{t('program.otherPrograms')}</p>
              <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                {others.map((p) => (
                  <li key={p.id}>
                    <TextLink href={`/programs/${p.slug}`}>{p.title}</TextLink>
                  </li>
                ))}
                <li>
                  <TextLink href="/programs" tone="red">
                    {t('program.backToPrograms')}
                  </TextLink>
                </li>
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}
