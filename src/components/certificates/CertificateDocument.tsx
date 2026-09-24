import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { SITE_URL } from '@/lib/site'
import { formatInZone } from '@/lib/time'

export type CertificateView = {
  number: string
  kind: 'graduation' | 'attendance'
  nameAr: string
  nameEn: string
  programTitleAr: string
  programTitleEn: string
  issuedAt: string
}

/**
 * The certificate itself: one sheet, both languages side by side — Arabic in its own
 * right-to-left half, English in its own left-to-right half — so the same paper serves
 * anywhere. The red rule, the two wordmarks, the name large, the program, the date, the
 * number, and the address that verifies it. `data-print-root` makes it the only thing on
 * paper when printed (globals.css).
 */
export async function CertificateDocument({
  certificate: c,
  academyZone,
}: {
  certificate: CertificateView
  academyZone: string
}) {
  const [ar, en] = await Promise.all([
    getTranslations({ locale: 'ar', namespace: 'certificate' }),
    getTranslations({ locale: 'en', namespace: 'certificate' }),
  ])
  const verifyAr = `${SITE_URL}/ar/verify/${c.number}`
  const verifyEn = `${SITE_URL}/en/verify/${c.number}`
  const body = c.kind === 'graduation' ? 'graduationBody' : 'attendanceBody'

  const half = (
    lang: 'ar' | 'en',
    t: typeof ar,
    name: string,
    program: string,
    logo: string,
    verify: string,
  ) => (
    <div
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="flex flex-col gap-5 p-8 md:p-10"
    >
      <Image
        src={logo}
        alt=""
        width={lang === 'ar' ? 132 : 150}
        height={60}
        className="h-12 w-auto self-start"
        unoptimized
      />
      <p className="text-sm font-semibold text-red-700">{t(c.kind)}</p>
      <p className="text-sm text-ink-700">{t('graduationLine')}</p>
      <p className="text-3xl leading-tight text-ink-900">{name}</p>
      <p className="measure text-base text-ink-700">{t(body, { program })}</p>
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4 text-xs text-ink-500">
        <span>{t('issued', { date: formatInZone(c.issuedAt, lang, academyZone).date })}</span>
        <span>
          {t('number')}: <bdi dir="ltr">{c.number}</bdi>
        </span>
        {/* The address on its own line, left to right and unbroken: split mid-number (or
            reordered inside Arabic text) it could not be typed back in from paper. */}
        <span>{t('verify')}</span>
        <bdi dir="ltr" className="block self-start font-medium whitespace-nowrap text-ink-700">
          {verify.replace(/^https?:\/\//, '')}
        </bdi>
      </div>
    </div>
  )

  return (
    <article
      data-print-root
      className="relative overflow-hidden rounded-brand border border-line-strong bg-paper print:border-ink-900"
    >
      {/* The red rule: the identity at the edge, as on the site (the wordmarks carry the mark). */}
      <div aria-hidden className="h-1.5 bg-red-600" />
      {/* Arabic always on the right, like any bilingual certificate, whatever the page's
          language; each half then sets its own direction. */}
      <div
        dir="rtl"
        className="grid md:grid-cols-2 md:divide-x md:divide-line print:grid-cols-2 print:divide-x print:divide-line"
      >
        {half('ar', ar, c.nameAr, c.programTitleAr, '/brand/logo.svg', verifyAr)}
        {half('en', en, c.nameEn, c.programTitleEn, '/brand/logo-en.svg', verifyEn)}
      </div>
    </article>
  )
}
