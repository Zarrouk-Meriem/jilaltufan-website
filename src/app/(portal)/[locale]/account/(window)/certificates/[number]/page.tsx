import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { CertificateDocument } from '@/components/certificates/CertificateDocument'
import { PrintButton } from '@/components/certificates/PrintButton'
import { PageOpening } from '@/components/portal/pieces'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { getClient } from '@/lib/queries/client'
import { getSiteSettings } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/certificates/[number]'>): Promise<Metadata> {
  const { number } = await params
  return { title: number }
}

/** One of the student's own certificates, ready to print or save as PDF. */
export default async function CertificatePage({
  params,
}: PageProps<'/[locale]/account/certificates/[number]'>) {
  const { locale: raw, number } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  const payload = await getClient()
  // Pinned to this account: a number alone never opens someone else's certificate here.
  const found = await payload.find({
    collection: 'certificates',
    where: {
      and: [
        { number: { equals: number } },
        { account: { equals: account.id } },
        { revoked: { not_equals: true } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const c = found.docs[0]
  if (!c) redirect(`/${locale}/account/certificates`)
  const settings = await getSiteSettings(locale)

  return (
    <>
      <PageOpening
        title={t(`certificate.${c.kind}` as 'certificate.graduation')}
        aside={<TextLink href="/account/certificates">{t('account.certificates.back')}</TextLink>}
      />
      <div className="flex flex-col gap-5">
        <CertificateDocument
          certificate={{
            number: c.number,
            kind: c.kind as 'graduation' | 'attendance',
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            programTitleAr: c.programTitleAr,
            programTitleEn: c.programTitleEn,
            issuedAt: c.issuedAt,
          }}
          academyZone={settings.academyTimeZone}
        />
        <div>
          <PrintButton label={t('account.certificates.print')} />
        </div>
      </div>
    </>
  )
}
