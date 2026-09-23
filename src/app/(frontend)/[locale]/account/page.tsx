import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { SessionFileForm } from '@/components/forms/AccountForms'
import { MaterialRow } from '@/components/sections/MaterialRow'
import { PageIntro } from '@/components/sections/PageIntro'
import { SessionRow } from '@/components/sections/SessionRow'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import type { Account } from '@/payload-types'
import { stripAccent } from '@/lib/accent'
import { getAccount } from '@/lib/auth/account'
import {
  getAccountApplication,
  getAccountInstructor,
  getAccountMaterials,
  getAccountSessions,
  getInstructorFiles,
  getInstructorSessions,
  getSiteSettings,
} from '@/lib/queries'
import { rel } from '@/lib/relations'
import { formatInZone } from '@/lib/time'
import { ordinalFor, sessionView } from '@/lib/view'
import { sendSessionFile, signOut } from './actions'

/** Per-visitor by definition: never prerendered, never cached, never indexed. */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('title')), robots: { index: false, follow: false } }
}

const STATUS_TONES: Record<string, BadgeTone> = {
  new: 'muted',
  reviewing: 'neutral',
  accepted: 'accent',
  waitlisted: 'neutral',
  rejected: 'struck',
}

/** Bytes as the one number a person needs, not as a precise size. */
const kb = (bytes: number | null) => (bytes ? `${Math.max(1, Math.round(bytes / 1024))} KB` : null)

export default async function AccountPage({ params }: PageProps<'/[locale]/account'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  const settings = await getSiteSettings(locale)
  if (account.kind === 'instructor') return <InstructorWindow account={account} locale={locale} />

  const application = await getAccountApplication(account, locale)
  const [sessions, materials] = await Promise.all([
    getAccountSessions(application, locale),
    getAccountMaterials(application, locale),
  ])
  const tz = settings.academyTimeZone
  const now = new Date()
  const signOutHere = signOut.bind(null, locale === 'en' ? 'en' : 'ar')

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('account.title')}
        intro={t('account.intro')}
        ordinal={account.name || account.email}
      />
      <div className="container-site flex flex-col gap-16 py-14 md:gap-24 md:py-20">
        <section>
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(0, t)}
            title={t('account.applicationTitle')}
          />
          <div className="mt-8 max-w-2xl">
            {application ? (
              <div className="rounded-brand border border-line p-6 md:p-8">
                <p className="text-xs font-medium text-ink-500">{t('application.statusLabel')}</p>
                <p className="mt-2">
                  <Badge tone={STATUS_TONES[application.status] ?? 'neutral'}>
                    {t(`application.status.${application.status}`)}
                  </Badge>
                </p>
                <p className="mt-4 text-base text-ink-700">
                  {t(`application.note.${application.status}`)}
                </p>

                <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-ink-500">
                      {t('application.submitted')}
                    </dt>
                    <dd className="mt-1 text-md font-medium text-ink-900">
                      {formatInZone(application.submittedAt, locale, tz).date}
                    </dd>
                  </div>
                  {application.program ? (
                    <div>
                      <dt className="text-xs font-medium text-ink-500">
                        {t('application.programLabel')}
                      </dt>
                      <dd className="mt-1 text-md font-medium text-ink-900">
                        {application.program.title}
                      </dd>
                    </div>
                  ) : null}
                  {application.details.map((d) => (
                    <div key={d.label}>
                      <dt className="text-xs font-medium text-ink-500">
                        {t(`account.details.${d.label}`)}
                      </dt>
                      <dd
                        className="mt-1 text-start text-md font-medium break-words text-ink-900"
                        dir={d.label === 'email' || d.label === 'phone' ? 'ltr' : undefined}
                      >
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {application.document ? (
                  <div className="mt-6 border-t border-line pt-6">
                    <p className="text-xs font-medium text-ink-500">{t('account.documents')}</p>
                    <p className="mt-2">
                      <a
                        href={application.document.url}
                        className="link-grow relative inline-block font-medium text-ink-900"
                      >
                        {application.document.name}
                      </a>
                      {kb(application.document.size) ? (
                        <span className="ms-2 text-sm text-ink-500">
                          {kb(application.document.size)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ) : null}

                <p className="mt-6 text-sm text-ink-500">{t('account.detailsNote')}</p>
              </div>
            ) : (
              <EmptyState
                title={t('account.noApplication')}
                body={t('account.noApplicationBody')}
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(1, t)}
            title={t('account.sessionsTitle')}
          />
          <div className="mt-8">
            {sessions.length ? (
              <div className="divide-y divide-line border-y border-line">
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
              <EmptyState
                title={t('account.noSessions')}
                body={application?.program ? undefined : t('account.noProgramYet')}
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(2, t)}
            title={t('account.materialsTitle')}
          />
          <div className="mt-8">
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
                      actionLabel={m.type === 'pdf' ? t('knowledge.download') : t('knowledge.open')}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState title={t('account.noMaterials')} />
            )}
          </div>
        </section>

        <section className="max-w-2xl">
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(3, t)}
            title={t('account.youTitle')}
          />
          <p className="mt-6 text-base text-ink-700">{t('account.youIntro')}</p>
          <p className="mt-4">
            <TextLink href="/account/profile">{t('account.editProfile')}</TextLink>
          </p>
          <form action={signOutHere} className="mt-8">
            <Button type="submit" variant="secondary">
              {t('account.signOut')}
            </Button>
          </form>
        </section>
      </div>
    </>
  )
}

/**
 * The guest instructor's window: the sessions they are teaching with the link to join, and
 * the materials they send for them. Their public profile is shown back to them but not
 * editable here — whether a guest may change what the site says about them is a question
 * for the academy, and it is in TODO.md.
 */
async function InstructorWindow({ account, locale }: { account: Account; locale: Locale }) {
  const t = await getTranslations()
  const settings = await getSiteSettings(locale)
  const instructor = await getAccountInstructor(account, locale)
  const [sessions, files] = await Promise.all([
    getInstructorSessions(instructor, locale),
    getInstructorFiles(account),
  ])
  const tz = settings.academyTimeZone
  const now = new Date()
  const signOutHere = signOut.bind(null, locale === 'en' ? 'en' : 'ar')
  const parts = (iso: string) => formatInZone(iso, locale, tz)

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('account.teaching.title')}
        intro={t('account.teaching.intro')}
        ordinal={account.name || account.email}
      />
      <div className="container-site flex flex-col gap-16 py-14 md:gap-24 md:py-20">
        <section>
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(0, t)}
            title={t('account.teaching.sessionsTitle')}
          />
          <div className="mt-8">
            {sessions.length ? (
              <div className="divide-y divide-line border-y border-line">
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
                      programTitle={v.programTitle}
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
                title={t('account.teaching.noSessions')}
                body={t('account.teaching.noSessionsBody')}
              />
            )}
          </div>
        </section>

        {sessions.length ? (
          <section className="max-w-2xl">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(1, t)}
              title={t('account.teaching.filesTitle')}
            />
            <p className="mt-6 text-base text-ink-700">{t('account.teaching.filesIntro')}</p>
            {files.length ? (
              <ul className="mt-6 flex flex-col gap-2 border-y border-line py-4">
                {files.map((f) => (
                  <li key={f.id} className="text-sm">
                    {f.url ? (
                      <a
                        href={f.url}
                        className="link-grow relative inline-block font-medium text-ink-900"
                      >
                        {f.name}
                      </a>
                    ) : (
                      <span className="font-medium text-ink-900">{f.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8">
              <SessionFileForm
                action={sendSessionFile}
                sessions={sessions.map((s) => ({
                  id: s.id,
                  label: `${parts(s.startsAt).date} — ${s.title}`,
                }))}
              />
            </div>
          </section>
        ) : null}

        <section className="max-w-2xl">
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(sessions.length ? 2 : 1, t)}
            title={t('account.youTitle')}
          />
          <p className="mt-6 text-base text-ink-700">{t('account.youIntro')}</p>
          {instructor ? (
            <p className="mt-4 text-sm text-ink-500">{t('account.teaching.profileNote')}</p>
          ) : null}
          <p className="mt-4">
            <TextLink href="/account/profile">{t('account.editProfile')}</TextLink>
          </p>
          <form action={signOutHere} className="mt-8">
            <Button type="submit" variant="secondary">
              {t('account.signOut')}
            </Button>
          </form>
        </section>
      </div>
    </>
  )
}
