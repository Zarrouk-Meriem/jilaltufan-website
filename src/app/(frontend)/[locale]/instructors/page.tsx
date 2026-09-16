import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { InstructorCard } from '@/components/sections/InstructorCard'
import { PageIntro } from '@/components/sections/PageIntro'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { listOr, textOr } from '@/lib/cms'
import { getInstructorsPage, listInstructors } from '@/lib/queries'
import { rel } from '@/lib/relations'
import { ordinalFor } from '@/lib/view'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/instructors'>): Promise<Metadata> {
  const { locale } = await params
  const [t, cms] = await Promise.all([
    getTranslations({ locale, namespace: 'instructors' }),
    getInstructorsPage(locale as Locale),
  ])
  return {
    alternates: alternatesFor(locale as Locale, '/instructors'),
    title: stripAccent(t('title')),
    description: textOr(cms.intro, t('intro')),
  }
}

export default async function InstructorsPage({ params }: PageProps<'/[locale]/instructors'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const [instructors, cms] = await Promise.all([
    listInstructors(locale),
    getInstructorsPage(locale),
  ])
  // Editors own the panel in Payload (Windows → Instructor window); messages are the fallback.
  const guidelines = listOr(
    cms.guidelines?.map((g) => g.text),
    t.raw('instructors.guidelines') as string[],
  )
  const list = (items: string[]) => (
    <ol className="flex flex-col divide-y divide-line border-y border-line">
      {items.map((x, i) => (
        <li key={i} className="flex gap-6 py-4">
          <span className="w-8 shrink-0 text-sm text-red-700 tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-ink-900">{x}</span>
        </li>
      ))}
    </ol>
  )
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('instructors.title')}
        intro={textOr(cms.intro, t('instructors.intro'))}
        ordinal={t('nav.instructors')}
      />
      <div className="container-site flex flex-col gap-20 py-14 md:py-20">
        <section>
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(0, t)}
            title={t('instructors.directoryTitle')}
          />
          <div className="mt-8">
            {instructors.length ? (
              <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {instructors.map((i) => {
                  const photo = rel(i.photo)
                  return (
                    <li key={i.id}>
                      <InstructorCard
                        href={`/instructors/${i.slug}`}
                        name={i.name}
                        role={i.role}
                        photo={
                          photo?.url
                            ? {
                                url: photo.url,
                                alt: photo.alt,
                                width: photo.width,
                                height: photo.height,
                              }
                            : null
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState title={t('instructors.empty')} />
            )}
          </div>
        </section>
        <section className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(1, t)}
              title={t('instructors.forTitle')}
            />
          </div>
          <div className="flex flex-col gap-12 md:col-span-8">
            <div>
              <h3 className="text-lg">{t('instructors.guidelinesTitle')}</h3>
              <div className="mt-4">{list(guidelines)}</div>
            </div>
            <div>
              <h3 className="text-lg">{t('instructors.materialsTitle')}</h3>
              <p className="mt-3 measure text-ink-700">
                {textOr(cms.materialsBody, t('instructors.materialsBody'))}
              </p>
            </div>
            <div>
              <h3 className="text-lg">{t('instructors.scheduleTitle')}</h3>
              <p className="mt-3 measure text-ink-700">
                {textOr(cms.scheduleBody, t('instructors.scheduleBody'))}
              </p>
            </div>
            <div>
              <h3 className="text-lg">{t('instructors.contactTitle')}</h3>
              <ButtonLink href="/contact" variant="secondary" size="sm" className="mt-4">
                {t('nav.contact')}
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
