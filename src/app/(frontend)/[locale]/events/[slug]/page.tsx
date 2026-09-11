import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Prose } from '@/components/content/Prose'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { Gallery, type GalleryImage } from '@/components/ui/Gallery'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import { routing, type Locale } from '@/i18n/routing'
import { getEventBySlug, getSiteSettings, listEventSlugs } from '@/lib/queries'
import { rel } from '@/lib/relations'
import { formatInZone } from '@/lib/time'
import { ordinalFor } from '@/lib/view'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listEventSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/events/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const e = await getEventBySlug(locale as Locale, slug)
  if (!e) return {}
  return {
    title: e.seo?.title || e.title,
    description: e.seo?.description || e.summary || undefined,
  }
}

export default async function EventPage({ params }: PageProps<'/[locale]/events/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const event = await getEventBySlug(locale, slug)
  if (!event) notFound()
  const settings = await getSiteSettings(locale)
  const tz = settings.academyTimeZone
  const isCamp = event.type === 'camp'
  const start = formatInZone(event.startDate, locale, tz)
  const end = event.endDate ? formatInZone(event.endDate, locale, tz) : null
  const typeLabel = t(`events.${event.type}` as 'events.camp')
  const gallery: GalleryImage[] = (event.gallery ?? [])
    .map((g) => rel(g.image))
    .filter((m): m is NonNullable<typeof m> => !!m?.url)
    .map((m) => ({ url: m.url!, alt: m.alt, width: m.width, height: m.height }))
  const programme = event.programme ?? []

  return (
    <>
      {/* Hero — navy for the camp, paper for other events */}
      <header className={isCamp ? 'pattern-keffiyeh-navy surface-navy' : 'hairline-b'}>
        <div className="container-site pt-10 pb-14 md:pt-14 md:pb-20">
          <Breadcrumbs
            label={t('common.breadcrumb')}
            className={isCamp ? 'mb-8 [&_*]:text-on-navy-muted' : 'mb-8'}
            items={[{ label: t('nav.events'), href: '/events' }, { label: event.title }]}
          />
          <SectionHeading
            as="h1"
            locale={locale}
            onNavy={isCamp}
            title={event.title}
            ordinal={typeLabel}
            intro={event.summary ?? undefined}
            className="[&_h1]:text-3xl"
          />
          <dl
            className={`mt-10 grid max-w-2xl gap-x-10 gap-y-4 text-sm sm:grid-cols-2 ${isCamp ? 'text-on-navy-muted' : 'text-ink-700'}`}
          >
            <div>
              <dt className={`text-xs ${isCamp ? 'text-on-navy-muted' : 'text-ink-500'}`}>
                {t('events.dates')}
              </dt>
              <dd
                className={`mt-1 font-medium tabular-nums ${isCamp ? 'text-on-navy' : 'text-ink-900'}`}
              >
                {end && end.date !== start.date ? `${start.date} — ${end.date}` : start.date}
              </dd>
            </div>
            <div>
              <dt className={`text-xs ${isCamp ? 'text-on-navy-muted' : 'text-ink-500'}`}>
                {t('events.location')}
              </dt>
              <dd className={`mt-1 font-medium ${isCamp ? 'text-on-navy' : 'text-ink-900'}`}>
                {event.isOnline ? t('events.online') : event.location || '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {event.registrationMode === 'link' && event.registrationLink ? (
              <ButtonLink
                href={event.registrationLink as never}
                variant={isCamp ? 'onNavy' : 'primary'}
                size="lg"
              >
                {t('events.registerExternal')}
              </ButtonLink>
            ) : event.registrationMode === 'form' ? (
              <ButtonLink href="/contact" variant={isCamp ? 'onNavy' : 'primary'} size="lg">
                {t('events.register')}
              </ButtonLink>
            ) : (
              <Badge
                tone="muted"
                className={
                  isCamp ? 'border-on-navy-line bg-transparent text-on-navy-muted' : undefined
                }
              >
                {t('events.registrationNone')}
              </Badge>
            )}
            {event.isPlaceholder && process.env.NODE_ENV !== 'production' ? (
              <Badge tone="accent">{t('a11y.placeholderContent')}</Badge>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container-site flex flex-col gap-20 py-14 md:py-20">
        {programme.length ? (
          <section id="programme" className="scroll-mt-28">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(0, t)}
              title={t('events.programme')}
            />
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {programme.map((day, i) => (
                <li key={day.id ?? i} className="rounded-brand border border-line p-6 md:p-7">
                  <span className="text-xs text-ink-500">
                    {t('events.day', { n: i + 1 })}
                    {day.date ? ` · ${formatInZone(day.date, locale, tz).date}` : ''}
                  </span>
                  <h3 className="mt-1 text-md">{day.dayTitle}</h3>
                  {day.items?.length ? (
                    <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
                      {day.items.map((it, j) => (
                        <li key={it.id ?? j} className="flex gap-4 py-3 text-sm">
                          {it.time ? (
                            <span className="w-14 shrink-0 text-ink-500 tabular-nums">
                              {it.time}
                            </span>
                          ) : null}
                          <span>
                            <span className="font-medium text-ink-900">{it.title}</span>
                            {it.description ? (
                              <span className="mt-1 block text-ink-700">{it.description}</span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {event.body ? (
          <section id="details" className="scroll-mt-28">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(programme.length ? 1 : 0, t)}
              title={t('events.details')}
            />
            <Prose data={event.body} size="md" className="mt-8" />
          </section>
        ) : null}

        {gallery.length ? (
          <section id="gallery" className="scroll-mt-28">
            <SectionHeading locale={locale} size="md" title={t('events.gallery')} />
            <div className="mt-8">
              <Gallery
                images={gallery}
                labels={{
                  open: (n, total) => t('events.openImage', { n, total }),
                  close: t('events.closeLightbox'),
                  prev: t('events.prevImage'),
                  next: t('events.nextImage'),
                }}
              />
            </div>
          </section>
        ) : null}

        <p>
          <TextLink href="/events">{t('events.allEvents')}</TextLink>
        </p>
      </div>
    </>
  )
}
