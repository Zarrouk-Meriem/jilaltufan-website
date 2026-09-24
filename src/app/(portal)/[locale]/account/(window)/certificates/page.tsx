import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { BadgeGrid } from '@/components/portal/BadgeGrid'
import { Card, PageOpening } from '@/components/portal/pieces'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { studentBadges } from '@/lib/badges/award'
import { issueDueCertificates } from '@/lib/certificates/issue'
import { getSiteSettings } from '@/lib/queries'
import { formatInZone } from '@/lib/time'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/certificates'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account.certificates' })
  return { title: t('title') }
}

/**
 * The student's certificates. Opening this page is what issues any that are due (a
 * graduation ticked by staff, an attendance share reached) — see `issueDueCertificates`.
 */
export default async function CertificatesPage({
  params,
}: PageProps<'/[locale]/account/certificates'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  if (account.kind !== 'student') redirect(`/${locale}/account`)

  // Certificates first: a certificate issued now can earn a badge in the same visit.
  const [{ certificates, waitingForName }, settings] = await Promise.all([
    issueDueCertificates(account),
    getSiteSettings(locale),
  ])
  const badges = await studentBadges(account, locale)

  return (
    <>
      <PageOpening
        title={t('account.certificates.title')}
        intro={t('account.certificates.intro')}
      />
      <div className="flex flex-col gap-5">
        {waitingForName ? (
          <Card tone="navy">
            <p className="text-lg font-semibold">{t('account.certificates.waitingTitle')}</p>
            <p className="mt-2 measure text-base text-on-navy/78">
              {t('account.certificates.waitingBody')}
            </p>
            <p className="mt-5">
              <ButtonLink href="/account/profile#official-name">
                {t('account.certificates.confirmName')}
              </ButtonLink>
            </p>
          </Card>
        ) : null}

        {certificates.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {certificates.map((c) => (
              <li key={c.id} className="flex">
                <Card tone={c.revoked ? 'quiet' : 'paper'} className="flex w-full flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={c.revoked ? 'struck' : 'accent'}>
                      {t(`certificate.${c.kind}` as 'certificate.graduation')}
                    </Badge>
                    {c.revoked ? (
                      <Badge tone="muted">{t('account.certificates.revoked')}</Badge>
                    ) : null}
                  </div>
                  <h2 className="text-lg">
                    {locale === 'en' ? c.programTitleEn : c.programTitleAr}
                  </h2>
                  <p className="text-sm text-ink-500">
                    {formatInZone(c.issuedAt, locale, settings.academyTimeZone).date} ·{' '}
                    <bdi dir="ltr">{c.number}</bdi>
                  </p>
                  {c.revoked ? null : (
                    <div className="mt-auto pt-2">
                      <ButtonLink href={`/account/certificates/${c.number}`} variant="secondary">
                        {t('account.certificates.view')}
                      </ButtonLink>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        ) : waitingForName ? null : (
          <EmptyState
            title={t('account.certificates.none')}
            body={t('account.certificates.noneBody')}
          />
        )}

        {badges.length ? (
          <section aria-labelledby="badges-title" className="mt-8">
            <h2 id="badges-title" className="text-xl">
              {t('account.badges.title')}
            </h2>
            <p className="mt-2 mb-5 measure text-sm text-ink-500">{t('account.badges.intro')}</p>
            <BadgeGrid
              badges={badges}
              locale={locale}
              academyZone={settings.academyTimeZone}
              labels={{
                awarded: (date) => t('account.badges.awarded', { date }),
                how: (b) =>
                  t(`account.badges.how.${b.rule}` as 'account.badges.how.manual', {
                    n: b.threshold ?? 0,
                  }),
              }}
            />
          </section>
        ) : null}
      </div>
    </>
  )
}
