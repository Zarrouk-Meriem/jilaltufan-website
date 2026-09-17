import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ApplySection } from '@/components/forms/ApplySection'
import { PageIntro } from '@/components/sections/PageIntro'
import { ButtonLink } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Callout'
import type { Locale } from '@/i18n/routing'
import { countryOptions } from '@/lib/countries'
import { getProgramBySlug } from '@/lib/queries'
import { submitApplication } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/apply/[programSlug]'>): Promise<Metadata> {
  const { locale, programSlug } = await params
  const [t, p] = await Promise.all([
    getTranslations({ locale, namespace: 'apply' }),
    getProgramBySlug(locale as Locale, programSlug),
  ])
  if (!p) return {}
  return {
    alternates: alternatesFor(locale as Locale, `/apply/${programSlug}`),
    title:
      p.registrationMode === 'open'
        ? t('formTitleOpen', { program: p.title })
        : t('formTitle', { program: p.title }),
    robots: { index: false },
  }
}

export default async function ApplyProgramPage({
  params,
}: PageProps<'/[locale]/apply/[programSlug]'>) {
  const { locale: raw, programSlug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const program = await getProgramBySlug(locale, programSlug)
  if (!program) notFound()
  const mode = program.registrationMode
  const crumbs = [{ label: t('nav.apply'), href: '/apply' }, { label: program.title }]

  if (mode === 'closed') {
    return (
      <>
        <PageIntro
          locale={locale}
          title={t('apply.closedTitle')}
          ordinal={program.title}
          crumbLabel={t('common.breadcrumb')}
          crumbs={crumbs}
        />
        <div className="container-reading py-14 md:py-20">
          <Callout>
            <p>{t('apply.closedBody', { program: program.title })}</p>
          </Callout>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/contact">{t('nav.contact')}</ButtonLink>
            <ButtonLink href="/programs" variant="secondary">
              {t('apply.otherPrograms')}
            </ButtonLink>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageIntro
        locale={locale}
        ordinal={program.title}
        crumbLabel={t('common.breadcrumb')}
        crumbs={crumbs}
        title={
          mode === 'open'
            ? t('apply.formTitleOpen', { program: program.title })
            : t('apply.formTitle', { program: program.title })
        }
        intro={t('apply.formIntro')}
      />
      <div className="container-reading py-14 md:py-20">
        <ApplySection
          locale={locale}
          programSlug={program.slug}
          programTitle={program.title}
          mode={mode === 'open' ? 'open' : 'application'}
          action={submitApplication}
          countries={countryOptions(locale)}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
        />
      </div>
    </>
  )
}
