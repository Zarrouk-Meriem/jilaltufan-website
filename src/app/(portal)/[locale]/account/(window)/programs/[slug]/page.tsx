import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { MaterialRow } from '@/components/sections/MaterialRow'
import { SessionRow } from '@/components/sections/SessionRow'
import { Card, PageOpening, Progress } from '@/components/portal/pieces'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { enrolledPrograms } from '@/lib/enrollment/access'
import {
  getAccountMaterials,
  getAccountProgress,
  getAccountSessions,
  getProgramBySlug,
  getSiteSettings,
} from '@/lib/queries'
import { rel } from '@/lib/relations'
import { sessionView } from '@/lib/view'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/programs/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const program = await getProgramBySlug(locale as Locale, slug)
  return { title: program?.title }
}

/**
 * The student's own page for one program they are enrolled in: where they stand, what is
 * next, and what to read. Open only while the access rule holds (enrolled, accepted,
 * account active) — anyone else is sent back to the program list.
 */
export default async function MyProgramPage({
  params,
  searchParams,
}: PageProps<'/[locale]/account/programs/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  const mine = (await enrolledPrograms(account, locale)).find((p) => p.slug === slug)
  if (!mine) redirect(`/${locale}/account/programs`)

  const [program, settings, sessions, materials, progress] = await Promise.all([
    getProgramBySlug(locale, slug),
    getSiteSettings(locale),
    getAccountSessions([mine], locale),
    getAccountMaterials([mine], locale),
    getAccountProgress(account, mine),
  ])
  const welcome = (await searchParams).enrolled === '1'
  const tz = settings.academyTimeZone
  const now = new Date()

  return (
    <>
      <PageOpening
        title={mine.title}
        intro={program?.shortDescription ?? undefined}
        aside={<TextLink href="/account/programs">{t('account.programs.page.back')}</TextLink>}
      />
      <div className="flex flex-col gap-5">
        {welcome ? (
          <p
            role="status"
            className="enter rounded-brand border border-s-2 border-line border-s-red-600 bg-paper px-5 py-4 text-base font-medium text-ink-900"
          >
            {t('account.programs.page.welcome')}
          </p>
        ) : null}

        {progress ? (
          <Card title={t('account.progressTitle')}>
            <Progress
              attended={progress.attended}
              total={progress.total}
              label={t('account.progress', { attended: progress.attended, total: progress.total })}
              note={
                progress.excused > 0
                  ? t('account.progressExcused', { excused: progress.excused })
                  : undefined
              }
            />
          </Card>
        ) : null}

        <Card title={t('account.programs.page.scheduleTitle')}>
          {sessions.length ? (
            <div className="divide-y divide-line">
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
            <EmptyState title={t('account.noSessions')} />
          )}
        </Card>

        <Card title={t('account.programs.page.materialsTitle')}>
          {materials.length ? (
            <div className="divide-y divide-line">
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
                    actionLabel={m.type === 'pdf' ? t('knowledge.download') : t('knowledge.open')}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState title={t('account.programs.page.noMaterials')} />
          )}
        </Card>
      </div>
    </>
  )
}
