import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Card, Fact, Facts, PageOpening } from '@/components/portal/pieces'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { getAccountApplication, getSiteSettings } from '@/lib/queries'
import { formatInZone } from '@/lib/time'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/application'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('nav.application') }
}

const TONES: Record<string, BadgeTone> = {
  new: 'muted',
  reviewing: 'neutral',
  accepted: 'accent',
  waitlisted: 'neutral',
  rejected: 'struck',
}

/** Bytes as the one number a person needs, not as a precise size. */
const kb = (bytes: number | null) => (bytes ? `${Math.max(1, Math.round(bytes / 1024))} KB` : null)

export default async function ApplicationPage({
  params,
}: PageProps<'/[locale]/account/application'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  // A guest instructor has no application; the section is not in their navigation either.
  if (account.kind === 'instructor') notFound()

  const application = await getAccountApplication(account, locale)
  const settings = await getSiteSettings(locale)

  // «طلبي» is in every student's navigation, so it must answer for a student who has none —
  // an account staff opened by hand, say. A 404 on a link the portal itself offers is a
  // dead end, not an answer.
  if (!application)
    return (
      <>
        <PageOpening title={t('account.nav.application')} />
        <EmptyState title={t('account.noApplication')} body={t('account.noApplicationBody')} />
      </>
    )

  return (
    <>
      <PageOpening
        title={t('account.nav.application')}
        intro={t('account.applicationIntro')}
        aside={
          <Badge tone={TONES[application.status] ?? 'neutral'}>
            {t(`application.status.${application.status}`)}
          </Badge>
        }
      />

      <div className="flex flex-col gap-5">
        <Card title={t('application.statusLabel')}>
          <p className="measure text-base text-ink-700">
            {t(`application.note.${application.status}`)}
          </p>
        </Card>

        <Card title={t('account.yourDetails')}>
          <Facts>
            <Fact
              label={t('application.submitted')}
              value={formatInZone(application.submittedAt, locale, settings.academyTimeZone).date}
            />
            {application.program ? (
              <Fact label={t('application.programLabel')} value={application.program.title} />
            ) : null}
            {application.details.map((d) => (
              <Fact
                key={d.label}
                label={t(`account.details.${d.label}`)}
                value={d.value}
                ltr={d.label === 'email' || d.label === 'phone'}
              />
            ))}
          </Facts>
          <p className="mt-6 text-sm text-ink-500">{t('account.detailsNote')}</p>
        </Card>

        {application.document ? (
          <Card title={t('account.documents')}>
            <p>
              <a
                href={application.document.url}
                className="link-grow relative inline-block font-medium text-ink-900"
              >
                {application.document.name}
              </a>
              {kb(application.document.size) ? (
                <span className="ms-2 text-sm text-ink-500">{kb(application.document.size)}</span>
              ) : null}
            </p>
          </Card>
        ) : null}
      </div>
    </>
  )
}
