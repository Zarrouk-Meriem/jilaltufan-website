import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Mark } from '@/components/brand/Mark'
import { Badge } from '@/components/ui/Badge'
import type { Locale } from '@/i18n/routing'
import { certificateByNumber } from '@/lib/certificates/issue'
import { getSiteSettings } from '@/lib/queries'
import { formatInZone } from '@/lib/time'

// Looked up per request: a certificate issued a minute ago or revoked a minute ago must
// already read that way. Never indexed — each page names a person.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/verify/[number]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'verify' })
  return { title: t('title'), robots: { index: false, follow: false } }
}

/**
 * Where the address printed on a certificate leads: is this a certificate the academy
 * issued, to whom, for what, and is it still valid. Only what is printed on the paper
 * anyway — never the account, the email, or the reason for a revocation.
 */
export default async function VerifyPage({ params }: PageProps<'/[locale]/verify/[number]'>) {
  const { locale: raw, number } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const [c, settings] = await Promise.all([
    certificateByNumber(decodeURIComponent(number).toUpperCase()),
    getSiteSettings(locale),
  ])
  const ar = locale === 'ar'

  return (
    <section className="container-reading flex flex-col items-start section-y">
      <Mark size={40} />
      <h1 className="mt-8 text-3xl">{t('verify.title')}</h1>
      <p className="mt-4 measure text-md text-ink-500">{t('verify.intro')}</p>

      <div className="mt-10 w-full rounded-brand border border-line bg-paper p-6 md:p-8">
        {c ? (
          <>
            <Badge tone={c.revoked ? 'struck' : 'accent'}>
              {c.revoked ? t('verify.revoked') : t('verify.valid')}
            </Badge>
            <dl className="mt-6 flex flex-col divide-y divide-line">
              {[
                { k: t('verify.name'), v: ar ? c.nameAr : c.nameEn, alt: ar ? c.nameEn : c.nameAr },
                {
                  k: t('verify.program'),
                  v: ar ? c.programTitleAr : c.programTitleEn,
                  alt: ar ? c.programTitleEn : c.programTitleAr,
                },
                { k: t('verify.kind'), v: t(`certificate.${c.kind}` as 'certificate.graduation') },
                {
                  k: t('verify.issued'),
                  v: formatInZone(c.issuedAt, locale, settings.academyTimeZone).date,
                },
                { k: t('verify.number'), v: <bdi dir="ltr">{c.number}</bdi> },
              ].map((row) => (
                <div key={row.k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
                  <dt className="text-sm text-ink-500">{row.k}</dt>
                  <dd className="text-end font-medium text-ink-900">
                    {row.v}
                    {'alt' in row && row.alt ? (
                      <span
                        lang={ar ? 'en' : 'ar'}
                        dir={ar ? 'ltr' : 'rtl'}
                        className="block text-sm font-normal text-ink-500"
                      >
                        {row.alt}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="text-base text-ink-700">{t('verify.notFound')}</p>
        )}
      </div>
    </section>
  )
}
