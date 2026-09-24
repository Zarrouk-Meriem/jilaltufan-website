import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { SessionRow } from '@/components/sections/SessionRow'
import { PageOpening } from '@/components/portal/pieces'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { enrolledPrograms } from '@/lib/enrollment/access'
import {
  getAccountInstructor,
  getAccountSessions,
  getInstructorSessions,
  getSiteSettings,
} from '@/lib/queries'
import { sessionView } from '@/lib/view'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/sessions'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('nav.sessions') }
}

export default async function SessionsPage({ params }: PageProps<'/[locale]/account/sessions'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  const settings = await getSiteSettings(locale)
  const teaching = account.kind === 'instructor'
  const instructor = teaching ? await getAccountInstructor(account, locale) : null
  const programs = teaching ? [] : await enrolledPrograms(account, locale)
  const sessions = teaching
    ? await getInstructorSessions(instructor, locale)
    : await getAccountSessions(programs, locale)
  const tz = settings.academyTimeZone
  const now = new Date()
  const over = (s: (typeof sessions)[number]) =>
    new Date(s.startsAt).getTime() + (s.durationMinutes ?? 60) * 60_000 < now.getTime()
  const upcoming = sessions.filter((s) => !over(s))
  // Most recent first: the one that just ended is the one someone looks back for.
  const past = sessions.filter(over).reverse()

  return (
    <>
      <PageOpening
        title={t('account.nav.sessions')}
        intro={t(teaching ? 'account.teaching.intro' : 'account.sessionsIntro')}
      />
      {sessions.length ? (
        // Upcoming first, then what is over: a long run of past sessions must not bury the
        // next one (the design lists "past sessions they taught" apart).
        <div className="flex flex-col gap-10">
          {(
            [
              ['upcoming', upcoming],
              ['past', past],
            ] as const
          )
            .filter(([, list]) => list.length)
            .map(([key, list]) => (
              <section key={key} aria-labelledby={`sessions-${key}`}>
                <h2 id={`sessions-${key}`} className="mb-4 text-xs font-semibold text-ink-500">
                  {t(`account.sessionsGroup.${key}`)}
                </h2>
                <div className="divide-y divide-line rounded-brand border border-line bg-paper px-6">
                  {list.map((s) => {
                    const v = sessionView(s, locale, tz, settings.joinWindowMinutes, t, now)
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
                        href={teaching ? undefined : v.href}
                        programTitle={teaching ? v.programTitle : undefined}
                        instructor={teaching ? undefined : v.instructor}
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
            ))}
        </div>
      ) : (
        <EmptyState
          title={t(teaching ? 'account.teaching.noSessions' : 'account.noSessions')}
          body={
            teaching
              ? t('account.teaching.noSessionsBody')
              : programs.length
                ? undefined
                : t('account.noProgramYet')
          }
        />
      )}
    </>
  )
}
