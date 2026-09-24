import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { SessionFileForm } from '@/components/forms/AccountForms'
import { MaterialRow } from '@/components/sections/MaterialRow'
import { Card, PageOpening } from '@/components/portal/pieces'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import {
  getAccountApplication,
  getAccountInstructor,
  getAccountMaterials,
  getInstructorFiles,
  getInstructorSessions,
  getSiteSettings,
} from '@/lib/queries'
import { rel } from '@/lib/relations'
import { formatInZone } from '@/lib/time'
import { sendSessionFile } from '../../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/materials'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('nav.materials') }
}

export default async function MaterialsPage({ params }: PageProps<'/[locale]/account/materials'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  // A guest sends materials; a student receives them. Same place in the navigation, because
  // it is the same question from either side: what belongs to my sessions?
  if (account.kind === 'instructor') {
    const settings = await getSiteSettings(locale)
    const instructor = await getAccountInstructor(account, locale)
    const [sessions, files] = await Promise.all([
      getInstructorSessions(instructor, locale),
      getInstructorFiles(account),
    ])
    const date = (iso: string) => formatInZone(iso, locale, settings.academyTimeZone).date

    return (
      <>
        <PageOpening
          title={t('account.nav.sentMaterials')}
          intro={t('account.teaching.filesIntro')}
        />
        <div className="flex flex-col gap-5">
          {files.length ? (
            <Card title={t('account.teaching.alreadySent')}>
              <ul className="flex flex-col gap-3">
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
            </Card>
          ) : null}

          {sessions.length ? (
            <Card title={t('account.teaching.sendOne')}>
              <SessionFileForm
                action={sendSessionFile}
                sessions={sessions.map((s) => ({
                  id: s.id,
                  label: `${date(s.startsAt)} — ${s.title}`,
                }))}
              />
            </Card>
          ) : (
            <EmptyState
              title={t('account.teaching.noSessions')}
              body={t('account.teaching.noSessionsBody')}
            />
          )}
        </div>
      </>
    )
  }

  const application = await getAccountApplication(account, locale)
  const materials = await getAccountMaterials(application, locale)

  return (
    <>
      <PageOpening title={t('account.nav.materials')} intro={t('account.materialsIntro')} />
      {materials.length ? (
        <div className="divide-y divide-line rounded-brand border border-line bg-paper px-6">
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
        <EmptyState
          title={t('account.noMaterials')}
          body={application?.program ? undefined : t('account.noProgramYet')}
        />
      )}
    </>
  )
}
