import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactForm } from '@/components/forms/ContactForm'
import { PageIntro } from '@/components/sections/PageIntro'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getSiteSettings } from '@/lib/queries'
import { submitContact } from './actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return {
    alternates: alternatesFor(locale as Locale, '/contact'),
    title: stripAccent(t('title')),
    description: t('intro'),
  }
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const settings = await getSiteSettings(locale)
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('contact.title')}
        intro={t('contact.intro')}
        ordinal={t('nav.contact')}
      />
      <div className="container-site grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <ContactForm action={submitContact} />
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          <div className="rounded-brand border border-line p-6">
            <p className="text-xs font-medium text-ink-500">{t('contact.email')}</p>
            <a
              href={`mailto:${settings.contactEmail}`}
              dir="ltr"
              className="link-grow relative mt-2 inline-block text-md font-medium text-ink-900"
            >
              {settings.contactEmail}
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
