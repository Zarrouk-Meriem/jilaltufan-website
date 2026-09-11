import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ButtonLink } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <>
      <section className="pattern-keffiyeh-navy surface-navy">
        <div className="container-site flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
          <SectionHeading
            as="h1"
            locale={locale}
            align="center"
            onNavy
            title={t('home.heroTitle')}
            className="[&_h1]:text-4xl"
          />
          <p className="mt-8 measure text-md text-on-navy-muted">{t('site.mission')}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/programs" size="lg">
              {t('home.exploreCta')}
            </ButtonLink>
            <ButtonLink href="/apply" size="lg" variant="onNavy">
              {t('home.applyCta')}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
