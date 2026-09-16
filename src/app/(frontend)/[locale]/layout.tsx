import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { localeMeta, routing, type Locale } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/queries'
import { alternatesFor, ogImageFor, organizationJsonLd } from '@/lib/seo'
import { SITE_NOINDEX, SITE_URL } from '@/lib/site'
import { JsonLd } from '@/components/content/JsonLd'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

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
    alternates: alternatesFor(locale as Locale, '/'),
    metadataBase: new URL(SITE_URL),
    title: { default: t('name'), template: `%s | ${t('name')}` },
    description: t('description'),
    icons: { icon: '/brand/favicon.svg' },
    robots: SITE_NOINDEX ? { index: false, follow: false } : undefined,
    twitter: { card: 'summary_large_image' },
    openGraph: {
      siteName: t('name'),
      locale: locale === 'ar' ? 'ar_PS' : 'en_US',
      type: 'website',
      images: ogImageFor(t('name'), t('tagline'), locale as Locale),
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const meta = localeMeta[locale]
  const t = await getTranslations('a11y')
  const ts = await getTranslations('site')
  const settings = await getSiteSettings(locale)
  const sameAs = (settings.socials ?? []).map((x) => x.url).filter((u): u is string => !!u)

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={fontVariables}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <JsonLd
            data={organizationJsonLd(
              locale,
              ts('name'),
              ts('description'),
              settings.contactEmail,
              sameAs,
            )}
          />
          <SkipLink label={t('skipToContent')} />
          <SiteHeader locale={locale} />
          <AnnouncementBar locale={locale} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
