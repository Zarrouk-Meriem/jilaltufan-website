import type { Metadata } from 'next'
import { Lock } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MaterialRow } from '@/components/sections/MaterialRow'
import { PageIntro } from '@/components/sections/PageIntro'
import { ProgramFilter } from '@/components/sections/ProgramFilter'
import { SessionRow } from '@/components/sections/SessionRow'
import { Accordion } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getSiteSettings, listMaterials, listPrograms, listSchedule } from '@/lib/queries'
import { rel } from '@/lib/relations'
import { ordinalFor, sessionView } from '@/lib/view'

export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/students'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'students' })
  return { title: stripAccent(t('title')), description: t('intro') }
}

export default async function StudentsPage({
  params,
  searchParams,
}: PageProps<'/[locale]/students'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const sp = await searchParams
  const programSlug = typeof sp.program === 'string' ? sp.program : undefined
  const t = await getTranslations()
  const now = new Date()
  const [settings, programs] = await Promise.all([getSiteSettings(locale), listPrograms(locale)])
  const tz = settings.academyTimeZone
  const win = settings.joinWindowMinutes
  const chosen = programSlug ? programs.find((p) => p.slug === programSlug) : undefined
  const [sessions, materials] = chosen
    ? await Promise.all([
        listSchedule(locale, chosen.slug, now),
        listMaterials(locale, chosen.slug),
      ])
    : [[], []]
  const upcoming = sessions
    .filter(
      (s) => new Date(s.startsAt).getTime() + (s.durationMinutes ?? 90) * 60_000 >= now.getTime(),
    )
    .slice(0, 4)
  const faq = t.raw('students.faq') as { q: string; a: string }[]
  const list = (items: string[]) => (
    <ol className="flex flex-col divide-y divide-line border-y border-line">
      {items.map((x, i) => (
        <li key={i} className="flex gap-6 py-4">
          <span className="w-8 shrink-0 text-sm text-red-700 tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-ink-900">{x}</span>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('students.title')}
        intro={t('students.intro')}
        ordinal={t('nav.students')}
      />
      <div className="container-site grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="flex flex-col gap-20 md:col-span-8">
          <section>
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(0, t)}
              title={t('students.howTitle')}
            />
            <div className="mt-8">
              {list(
                (t.raw('students.how') as string[]).map((s) => s.replace('{minutes}', String(win))),
              )}
            </div>
          </section>
          <section>
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(1, t)}
              title={t('students.joinTitle')}
            />
            <div className="mt-8">{list(t.raw('students.join') as string[])}</div>
          </section>

          <section id="my-program" className="scroll-mt-28">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(2, t)}
              title={t('students.myScheduleTitle')}
            />
            <div className="mt-8">
              <p className="mb-3 text-xs font-medium text-ink-500">{t('students.pickProgram')}</p>
              <ProgramFilter
                label={t('students.pickProgram')}
                allLabel={t('schedule.allPrograms')}
                basePath="/students"
                current={programSlug}
                items={programs.map((p) => ({ slug: p.slug, title: p.title }))}
              />
            </div>
            {chosen ? (
              <div className="mt-8">
                {upcoming.length ? (
                  <div className="divide-y divide-line border-y border-line">
                    {upcoming.map((s) => {
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
                ) : (
                  <EmptyState title={t('students.noSessions')} />
                )}
                <p className="mt-6">
                  <TextLink href={`/schedule?program=${chosen.slug}`}>
                    {t('students.fullSchedule')}
                  </TextLink>
                </p>
                <h3 className="mt-14 text-lg">{t('students.materialsTitle')}</h3>
                <div className="mt-4">
                  {materials.length ? (
                    <div className="divide-y divide-line border-y border-line">
                      {materials.map((m) => {
                        const file = rel(m.file)
                        return (
                          <MaterialRow
                            key={m.id}
                            title={m.title}
                            type={m.type}
                            typeLabel={t(`knowledge.${m.type}` as 'knowledge.pdf')}
                            href={m.type === 'pdf' ? file?.url : m.url}
                            description={m.description}
                            actionLabel={
                              m.type === 'pdf' ? t('knowledge.download') : t('knowledge.open')
                            }
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState title={t('students.noMaterials')} />
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(3, t)}
              title={t('students.conductTitle')}
            />
            <div className="mt-8">{list(t.raw('students.conduct') as string[])}</div>
          </section>
          <section>
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(4, t)}
              title={t('students.faqTitle')}
            />
            <div className="mt-8">
              <Accordion
                items={faq.map((f, i) => ({
                  id: `faq-${i + 1}`,
                  heading: f.q,
                  content: <p className="measure">{f.a}</p>,
                }))}
              />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 md:col-span-4">
          <div className="rounded-brand border border-line bg-paper-2 p-6" aria-disabled="true">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-md font-semibold text-ink-900">
                <Lock aria-hidden strokeWidth={1.5} className="size-4 text-ink-500" />
                {t('students.accountTitle')}
              </span>
              <Badge tone="muted">{t('students.accountSoon')}</Badge>
            </div>
            <p className="mt-3 text-sm text-ink-700">{t('students.accountBody')}</p>
          </div>
          <div className="rounded-brand border border-line p-6">
            <h2 className="text-md">{t('students.contactTitle')}</h2>
            <p className="mt-2 text-sm text-ink-700">{t('students.contactBody')}</p>
            <ButtonLink href="/contact" variant="secondary" size="sm" className="mt-4">
              {t('nav.contact')}
            </ButtonLink>
          </div>
        </aside>
      </div>
    </>
  )
}
