import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StatusLinkReissue } from '@/components/forms/StatusLinkReissue'
import { PageIntro } from '@/components/sections/PageIntro'

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
      <>
        <PageIntro locale={locale} title={t('title')} intro={t('intro')} />
        <div className="container-site py-14 md:py-20">
          <div className="max-w-2xl">
            <StatusLinkReissue token={token} action={reissueStatusLink} />
          </div>
        </div>
      </>
    )

  const settings = await getSiteSettings(locale)
  const submitted = formatInZone(application.submittedAt, locale, settings.academyTimeZone).date
  const status = application.status

  return (
    <>
      <PageIntro locale={locale} title={t('title')} intro={t('intro')} />
      <div className="container-site py-14 md:py-20">
        <div className="max-w-2xl">
          <div className="rounded-brand border border-line p-6 md:p-8">
            <p className="text-xs font-medium text-ink-500">{t('submitted')}</p>
            <p className="mt-1 text-md font-medium text-ink-900">{submitted}</p>
            <p className="mt-6 text-xs font-medium text-ink-500">{t('statusLabel')}</p>
            <p className="mt-2">
              <Badge tone={TONES[status] ?? 'neutral'}>{t(`status.${status}`)}</Badge>
            </p>
            <p className="mt-4 text-base text-ink-700">{t(`note.${status}`)}</p>
            {application.program ? (
              <>
                <p className="mt-6 text-xs font-medium text-ink-500">{t('programLabel')}</p>
                <p className="mt-1 text-md font-medium text-ink-900">{application.program}</p>
              </>
            ) : null}
          </div>

          <p className="mt-6 text-sm text-ink-500">{t('privateNote')}</p>
        </div>
      </div>
    </>
  )
}
