import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { SkipLink } from '@/components/layout/SkipLink'
import { localeMeta, routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

/**
 * The portal's own root layout — a second one, which is what a route group is for.
 *
 * Everything personal lives under here: the account window, and the page an applicant
 * follows from their letter. None of it gets the marketing header, the announcement bar or
 * the footer; a person signed into their own record is not browsing the academy, and being
 * shown «قدّم الآن» while already accepted was the confusion this split ends.
 *
 * Every page in this group is per-visitor, so none of it is indexed. The chrome itself is
 * `PortalShell`, chosen per page rather than here, because the signed-out doors want a
 * centred column and the window wants a rail.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'site' })
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('name'), template: `%s | ${t('name')}` },
    icons: { icon: '/brand/favicon.svg' },
    robots: { index: false, follow: false },
  }
}

export default async function PortalLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const meta = localeMeta[locale]
  const t = await getTranslations('a11y')

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={fontVariables}
      data-scroll-behavior="smooth"
    >
      <body>
        <NextIntlClientProvider>
          <SkipLink label={t('skipToContent')} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
