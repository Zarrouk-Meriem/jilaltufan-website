import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AnnouncementList } from '@/components/portal/AnnouncementList'
import { SessionRow } from '@/components/sections/SessionRow'
import { Card, PageOpening, Progress, QuickLinks } from '@/components/portal/pieces'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextLink } from '@/components/ui/TextLink'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { enrolledPrograms } from '@/lib/enrollment/access'
import {
  getAccountAnnouncements,
  getAccountApplication,
  getAccountInstructor,
  getAccountProgress,
  getAccountSessions,
  getInstructorSessions,
  getSiteSettings,
} from '@/lib/queries'
import { getSessionState } from '@/lib/time'
import { sessionView } from '@/lib/view'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('nav.overview') }
}

const STATUS_TONES: Record<string, BadgeTone> = {
  new: 'muted',
  reviewing: 'neutral',
  accepted: 'accent',
  waitlisted: 'neutral',
  rejected: 'struck',
  withdrawn: 'muted',
}

/** A link to another part of the portal, as a card rather than a line of text. */
function Jump({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link
      href={href as never}
      className="group rounded-brand border border-line bg-paper p-5 transition-colors duration-150 ease-brand hover:border-ink-700"
    >
      <span className="block text-md font-medium text-ink-900">{label}</span>
      <span className="mt-1 block text-sm text-ink-500">{hint}</span>
    </Link>
  )
}

export default async function OverviewPage({ params }: PageProps<'/[locale]/account'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  const settings = await getSiteSettings(locale)
  const tz = settings.academyTimeZone
  const now = new Date()
  // Their first name if we have one; the whole of whatever we do have otherwise.
  const whole = account.name || account.email
  const first = whole.split(' ')[0] || whole

  // The next session either way: the one thing both kinds open the portal to check.
  const instructor =
    account.kind === 'instructor' ? await getAccountInstructor(account, locale) : null
  const application =
    account.kind === 'instructor' ? null : await getAccountApplication(account, locale)
  // Only what the access rule allows: active account, accepted application, enrolled.
  const programs = account.kind === 'student' ? await enrolledPrograms(account, locale) : []
  const sessions = instructor
    ? await getInstructorSessions(instructor, locale)
    : await getAccountSessions(programs, locale)
  const announcements = await getAccountAnnouncements(programs, locale, 3)
  const progresses = (
    await Promise.all(
      programs.map(async (program) => {
        const progress = await getAccountProgress(account, program)
        return progress ? { program, ...progress } : null
      }),
    )
  ).filter((p) => p !== null)

  const upcoming = sessions.filter((s) => {
    const state = getSessionState(
      { startsAt: s.startsAt, durationMinutes: s.durationMinutes, sessionStatus: s.sessionStatus },
      now,
      settings.joinWindowMinutes,
    )
    return state !== 'completed' && state !== 'cancelled'
  })
  const next = upcoming[0]
  const nextView = next ? sessionView(next, locale, tz, settings.joinWindowMinutes, t, now) : null

  return (
    <>
      <PageOpening title={t('account.greeting', { name: first })} intro={t('account.intro')} />

      <div className="flex flex-col gap-5">
        {application ? (
          <Card title={t('application.statusLabel')}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Badge tone={STATUS_TONES[application.status] ?? 'neutral'}>
                {t(`application.status.${application.status}`)}
              </Badge>
              {programs.length ? (
                <span className="text-md font-medium text-ink-900">
                  {programs.map((p) => p.title).join(' · ')}
                </span>
              ) : null}
            </div>
            <p className="mt-4 measure text-base text-ink-700">
              {t(`application.note.${application.status}`)}
            </p>
            {application.status === 'accepted' && programs.length === 0 ? (
              <p className="mt-5">
                <ButtonLink href="/account/programs">{t('account.programs.choose')}</ButtonLink>
              </p>
            ) : null}
            <p className="mt-5">
              <TextLink href="/account/application">{t('account.seeApplication')}</TextLink>
            </p>
          </Card>
        ) : null}

        {announcements.length ? (
          <Card title={t('account.announcements.latest')}>
            <AnnouncementList
              items={announcements}
              locale={locale}
              academyZone={tz}
              labels={{
                forAll: t('account.announcements.forAll'),
                read: t('account.announcements.read'),
              }}
              fallbackSlug={programs[0]?.slug}
            />
          </Card>
        ) : null}

        <Card title={t('account.nextSession')}>
          {nextView ? (
            <>
              <SessionRow
                locale={locale}
                academyZone={tz}
                iso={nextView.iso}
                parts={nextView.parts}
                state={nextView.state}
                stateLabel={nextView.stateLabel}
                title={nextView.title}
                programTitle={nextView.programTitle}
                instructor={nextView.instructor}
                alQudsLabel={t('session.alQuds')}
                localLabel={t('session.local')}
                joinUrl={nextView.joinUrl}
                joinLabel={t('session.joinNow')}
                calendar={nextView.calendar}
              />
              <p className="mt-5">
                <TextLink href="/account/sessions">{t('account.seeAllSessions')}</TextLink>
              </p>
            </>
          ) : (
            <EmptyState
              title={t(
                account.kind === 'instructor'
                  ? 'account.teaching.noSessions'
                  : 'account.noSessions',
              )}
              body={
                account.kind === 'instructor'
                  ? t('account.teaching.noSessionsBody')
                  : programs.length
                    ? undefined
                    : t('account.noProgramYet')
              }
            />
          )}
        </Card>

        {progresses.length ? (
          <Card title={t('account.progressTitle')}>
            <div className="flex flex-col gap-6">
              {progresses.map((progress) => (
                <div key={progress.program.id}>
                  {progresses.length > 1 ? (
                    <p className="mb-2 text-sm font-medium text-ink-900">
                      {progress.program.title}
                    </p>
                  ) : null}
                  <Progress
                    attended={progress.attended}
                    total={progress.total}
                    label={t('account.progress', {
                      attended: progress.attended,
                      total: progress.total,
                    })}
                    note={
                      progress.excused > 0
                        ? t('account.progressExcused', { excused: progress.excused })
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <QuickLinks>
          <Jump
            href="/account/sessions"
            label={t('account.nav.sessions')}
            hint={t('account.jump.sessions')}
          />
          <Jump
            href="/account/materials"
            label={t(
              account.kind === 'instructor' ? 'account.nav.sentMaterials' : 'account.nav.materials',
            )}
            hint={t(
              account.kind === 'instructor'
                ? 'account.jump.sentMaterials'
                : 'account.jump.materials',
            )}
          />
        </QuickLinks>
      </div>
    </>
  )
}
