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

  return (
    <>
      <PageOpening
        title={t('account.nav.sessions')}
        intro={t(teaching ? 'account.teaching.intro' : 'account.sessionsIntro')}
      />
      {sessions.length ? (
        <div className="divide-y divide-line rounded-brand border border-line bg-paper px-6">
          {sessions.map((s) => {
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
