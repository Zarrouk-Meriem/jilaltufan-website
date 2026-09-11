import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EventCard } from '@/components/sections/EventCard'
import { PageIntro } from '@/components/sections/PageIntro'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getSiteSettings, listEvents } from '@/lib/queries'
import { formatInZone } from '@/lib/time'
import { ordinalFor } from '@/lib/view'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/events'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'events' })
  return { title: stripAccent(t('title')), description: t('intro') }
}

export default async function EventsPage({ params }: PageProps<'/[locale]/events'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const [settings, events] = await Promise.all([getSiteSettings(locale), listEvents(locale)])
  const tz = settings.academyTimeZone
  const now = new Date().getTime()
  const upcoming = events.filter((e) => new Date(e.endDate ?? e.startDate).getTime() >= now)
  const past = events.filter((e) => new Date(e.endDate ?? e.startDate).getTime() < now)
  const dateLabel = (e: (typeof events)[number]) => {
    const a = formatInZone(e.startDate, locale, tz)
    if (!e.endDate) return a.date
    const b = formatInZone(e.endDate, locale, tz)
    return a.date === b.date
      ? a.date
      : `${a.day} ${a.month === b.month ? '' : a.month} ${t('events.toDate')} ${b.date}`.replace(
          /\s+/g,
          ' ',
        )
  }
  const typeLabel = (type: string) => t(`events.${type}` as 'events.camp')
  const list = (items: typeof events) => (
    <ul className="grid gap-4">
      {items.map((e) => (
        <li key={e.id}>
          <EventCard
            href={`/events/${e.slug}`}
            title={e.title}
            typeLabel={typeLabel(e.type)}
            dateLabel={dateLabel(e)}
            location={e.isOnline ? t('events.online') : e.location}
            summary={e.summary}
            isCamp={e.type === 'camp'}
          />
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('events.title')}
        intro={t('events.intro')}
        ordinal={t('nav.events')}
      />
      <div className="container-site flex flex-col gap-20 py-14 md:py-20">
        <section>
          <SectionHeading
            locale={locale}
            size="md"
            ordinal={ordinalFor(0, t)}
            title={t('events.upcoming')}
          />
          <div className="mt-8">
            {upcoming.length ? list(upcoming) : <EmptyState title={t('events.empty')} />}
          </div>
        </section>
        {past.length ? (
          <section>
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(1, t)}
              title={t('events.past')}
            />
            <div className="mt-8">{list(past)}</div>
          </section>
        ) : null}
      </div>
    </>
  )
}
