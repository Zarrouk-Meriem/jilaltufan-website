import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Prose } from '@/components/content/Prose'
import { Icon, type IconName } from '@/components/icons/Icon'
import { PageIntro } from '@/components/sections/PageIntro'
import { PageNav } from '@/components/ui/PageNav'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAboutPage } from '@/lib/queries'
import { ordinalFor } from '@/lib/view'

export const revalidate = 300

/** One icon per value, in the order the academy lists them. */
const VALUE_ICONS: IconName[] = ['compass', 'graduation', 'target']

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return { alternates: alternatesFor(locale as Locale, '/about'), title: stripAccent(t('title')) }
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const about = await getAboutPage(locale)

  const sections = [
    { id: 'intro', title: t('about.intro'), show: !!about.intro },
    { id: 'vision', title: t('about.visionTitle'), show: !!about.vision },
    { id: 'mission', title: t('about.missionTitle'), show: !!about.mission },
    { id: 'goals', title: t('about.goalsTitle'), show: !!about.goals?.length },
  ].filter((s) => s.show)

  // The vision is three lines: a statement, a «quoted» formulation, and an equation.
  const visionLines = (about.vision ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const isQuote = (l: string) => /^[«“"]/.test(l)

  return (
    <>
      <PageIntro
        locale={locale}
        title={about.title ? about.title : t('about.title')}
        ordinal={t('nav.academy')}
      />
      <div className="container-site grid gap-10 py-12 md:grid-cols-12 md:gap-12 md:py-20">
        <aside className="min-w-0 md:col-span-3">
          <PageNav
            label={t('about.onThisPage')}
            items={sections.map(({ id, title }) => ({ id, title }))}
            extra={{ href: '/about/structure', label: t('about.structureLink') }}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-16 md:col-span-8 md:col-start-5 md:gap-24">
          {about.intro ? (
            <section id="intro" className="scroll-mt-28">
              <Prose data={about.intro} />
            </section>
          ) : null}

          {visionLines.length ? (
            <section id="vision" className="scroll-mt-28">
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(0, t)}
                title={t('about.visionTitle')}
              />
              <div className="mt-8 flex flex-col gap-6">
                {visionLines.map((line, i) =>
                  isQuote(line) ? (
                    <blockquote
                      key={i}
                      className="measure border-s-2 border-red-600 ps-5 text-md leading-relaxed text-ink-900"
                    >
                      {line}
                    </blockquote>
                  ) : (
                    <p key={i} className="measure text-base leading-relaxed text-ink-700">
                      {line}
                    </p>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {about.mission ? (
            <section id="mission" className="scroll-mt-28">
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(1, t)}
                title={t('about.missionTitle')}
              />
              <p className="mt-8 measure text-md leading-relaxed text-ink-900">{about.mission}</p>
              {about.pillars?.length ? (
                <ul className="mt-10 grid gap-4 sm:grid-cols-3">
                  {about.pillars.map((p, i) => {
                    const icon = VALUE_ICONS[i % VALUE_ICONS.length]!
                    return (
                      <li
                        key={p.id ?? i}
                        className="rounded-brand border border-line p-5 transition-colors duration-200 ease-brand hover:border-ink-900"
                      >
                        <Icon name={icon} className="size-6 text-navy-800" />
                        <h3 className="mt-4 text-base font-semibold text-ink-900">{p.title}</h3>
                        {p.text ? (
                          <p className="mt-2 text-sm leading-relaxed text-ink-700">{p.text}</p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </section>
          ) : null}

          {about.goals?.length ? (
            <section id="goals" className="scroll-mt-28">
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(2, t)}
                title={t('about.goalsTitle')}
              />
              <ol className="mt-8 flex flex-col divide-y divide-line border-y border-line">
                {about.goals.map((g, i) => (
                  <li key={g.id ?? i} className="flex gap-5 py-5">
                    <span className="w-7 shrink-0 pt-0.5 text-sm text-red-700 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-base leading-relaxed text-ink-900">{g.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}
