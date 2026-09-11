import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { localeMeta, routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'
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
    metadataBase: new URL(SITE_URL),
    title: { default: t('name'), template: `%s — ${t('name')}` },
    description: t('description'),
    icons: { icon: '/brand/favicon.svg' },
    openGraph: {
      siteName: t('name'),
      locale: locale === 'ar' ? 'ar_PS' : 'en_US',
      type: 'website',
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
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
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <SkipLink label={t('skipToContent')} />
          <SiteHeader locale={locale} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
