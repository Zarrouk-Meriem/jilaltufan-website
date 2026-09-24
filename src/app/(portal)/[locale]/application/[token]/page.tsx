import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StatusLinkReissue } from '@/components/forms/StatusLinkReissue'
import { PortalShell } from '@/components/portal/PortalShell'
import { Card, Fact, Facts, PageOpening } from '@/components/portal/pieces'

import { ButtonLink } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getApplicationByStatusToken, getSiteSettings } from '@/lib/queries'
import { formatInZone } from '@/lib/time'
import { reissueStatusLink } from './actions'

/**
 * One applicant's own page, found by the token in their confirmation letter (PLAN.md
 * §13.3). Per-visitor by definition: never prerendered, never cached, never indexed.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/application/[token]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'application' })
  // No alternates: a private page has no public counterpart to advertise.
  return { title: stripAccent(t('title')), robots: { index: false, follow: false } }
}

const TONES: Record<string, BadgeTone> = {
  new: 'muted',
  reviewing: 'neutral',
  accepted: 'accent',
  waitlisted: 'neutral',
  rejected: 'struck',
  withdrawn: 'muted',
}

export default async function ApplicationStatusPage({
  params,
}: PageProps<'/[locale]/application/[token]'>) {
  const { locale: raw, token } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('application')

  const application = await getApplicationByStatusToken(decodeURIComponent(token), locale)
  // An unknown token and a made-up one get the same answer.
  if (!application) notFound()

  // An expired link shows no status at all — otherwise expiry would mean nothing, and an
  // old letter in a mailbox would keep answering for as long as the application exists.
  if (application.expired)
    return (
      <PortalShell locale={locale}>
        <PageOpening title={t('title')} intro={t('intro')} />
        <StatusLinkReissue token={token} action={reissueStatusLink} />
      </PortalShell>
    )

  const settings = await getSiteSettings(locale)
  const submitted = formatInZone(application.submittedAt, locale, settings.academyTimeZone).date
  const status = application.status

  return (
    <PortalShell locale={locale}>
      <PageOpening
        title={t('title')}
        intro={t('intro')}
        aside={<Badge tone={TONES[status] ?? 'neutral'}>{t(`status.${status}`)}</Badge>}
      />
      <div className="flex flex-col gap-5">
        <Card title={t('statusLabel')}>
          <p className="measure text-base text-ink-700">{t(`note.${status}`)}</p>
          {status === 'accepted' ? (
            // Accepted means a window of their own: the way in, and how the first time works.
            <div className="mt-5 flex flex-col items-start gap-2">
              <ButtonLink href="/account/sign-in">{t('signIn')}</ButtonLink>
              <p className="measure text-sm text-ink-500">{t('signInNote')}</p>
            </div>
          ) : null}
        </Card>
        <Card title={t('submitted')}>
          <Facts>
            <Fact label={t('submitted')} value={submitted} />
          </Facts>
        </Card>
        <p className="text-sm text-ink-500">{t('privateNote')}</p>
      </div>
    </PortalShell>
  )
}
