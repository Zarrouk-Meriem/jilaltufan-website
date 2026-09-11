import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Prose } from '@/components/content/Prose'
import { PageIntro } from '@/components/sections/PageIntro'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAboutPage } from '@/lib/queries'
import { ordinalFor } from '@/lib/view'

export const revalidate = 300

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
    { id: 'vision', title: t('about.visionTitle'), show: !!about.vision },
    { id: 'mission', title: t('about.missionTitle'), show: !!about.mission },
    { id: 'goals', title: t('about.goalsTitle'), show: !!about.goals?.length },
  ].filter((s) => s.show)

  return (
    <>
      <PageIntro
        locale={locale}
        title={about.title ? about.title : t('about.title')}
        ordinal={t('nav.academy')}
      />
      <div className="container-site grid gap-12 py-14 md:grid-cols-12 md:py-20">
        {/* Side rail: on-this-page + structure link */}
        <aside className="md:col-span-3">
          <nav aria-label={t('about.onThisPage')} className="md:sticky md:top-28">
            <p className="text-xs font-medium text-ink-500">{t('about.onThisPage')}</p>
            <ul className="mt-3 flex flex-col gap-2 border-s border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="link-grow relative -ms-px block border-s border-transparent ps-4 text-sm text-ink-700 hover:border-ink-900 hover:text-ink-900"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
              <li>
                <TextLink
                  href="/about/structure"
                  className="-ms-px block border-s border-transparent ps-4 text-sm"
                >
                  {t('about.structureLink')}
                </TextLink>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="flex flex-col gap-20 md:col-span-8 md:col-start-5">
          {about.intro ? <Prose data={about.intro} size="md" /> : null}

          {about.vision ? (
            <section id="vision" className="scroll-mt-28">
              <SectionHeading
                locale={locale}
                size="md"
                ordinal={ordinalFor(0, t)}
                title={t('about.visionTitle')}
              />
              <p className="mt-8 measure text-md text-ink-900">{about.vision}</p>
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
              <p className="mt-8 measure text-lg leading-relaxed text-ink-900">{about.mission}</p>
              {about.pillars?.length ? (
                <ul className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
                  {about.pillars.map((p, i) => (
                    <li key={p.id ?? i}>
                      <span className="text-xs text-ink-500">{String(i + 1).padStart(2, '0')}</span>
                      <h3 className="mt-1 text-md">{p.title}</h3>
                      {p.text ? <p className="mt-2 text-sm text-ink-700">{p.text}</p> : null}
                    </li>
                  ))}
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
                  <li key={g.id ?? i} className="flex gap-6 py-5">
                    <span className="w-8 shrink-0 text-sm text-red-700 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-md text-ink-900">{g.text}</span>
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
