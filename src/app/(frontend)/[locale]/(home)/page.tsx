import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { InstructorCard } from '@/components/sections/InstructorCard'
import { ProgramCard } from '@/components/sections/ProgramCard'
import { SeasonTimeline, type Station } from '@/components/sections/SeasonTimeline'
import { SessionRow } from '@/components/sections/SessionRow'
import { ButtonLink } from '@/components/ui/Button'
import { LivingCascade } from '@/components/brand/LivingCascade'
import { DuotoneImage } from '@/components/ui/DuotoneImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { parseAccent, stripAccent } from '@/lib/accent'
import { rel } from '@/lib/relations'
import {
  getCamp,
  getHomePage,
  getSiteSettings,
  listInstructors,
  listMinbarPosts,
  listPrograms,
  listSessionsInRange,
  listUpcomingSessions,
} from '@/lib/queries'
import { currentSeasonStartYear, formatInZone, monthKeyInZone, seasonMonthKeys } from '@/lib/time'
import { ordinalFor, registrationBadge, sessionView } from '@/lib/view'
import { SeasonRange } from '@/components/content/SeasonRange'
import { cn } from '@/lib/cn'
import { mediaImage, optimizedImageUrl } from '@/lib/media'
import { seasonMonths, seasonRange, sessionsCountLabel, trackLabel } from '@/lib/program'

export const revalidate = 60

/**
 * The photograph and its silhouette mask share one box on the far side from the copy:
 * it starts 40% in, so the picture mainly lives beside the text and reaches only a
 * little under it, and its near edge dissolves into the surface through a mask (no
 * seam, and the cascade behind is untouched). Wide frames only: on a phone the copy
 * sits over the photo and the same dissolve simply darkens the near side.
 */
const HERO_BOX = 'md:start-[40%] [--edge:right] rtl:[--edge:left]'
const HERO_EDGE = 'linear-gradient(to var(--edge), transparent, #000 30%)'
/** Tailwind's `xl`: where the silhouette mask switches to the 1920 file. */
const CUTOUT_XL = 1280

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'site' })
  return {
    alternates: alternatesFor(locale as Locale, '/'),
    title: { absolute: `${t('name')} | ${t('tagline')}` },
    description: t('description'),
  }
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const now = new Date()
  const season = (p: (typeof programs)[number]) => {
    const m = seasonMonths(p, t)
    return m ? <SeasonRange {...m} label={seasonRange(p, t) ?? ''} /> : null
  }

  const [home, settings, programs, upcoming, camp, posts, instructors] = await Promise.all([
    getHomePage(locale),
    getSiteSettings(locale),
    listPrograms(locale),
    listUpcomingSessions(locale, 3, now),
    getCamp(locale),
    listMinbarPosts(locale, 3),
    listInstructors(locale, 8),
  ])
  const tz = settings.academyTimeZone
  const win = settings.joinWindowMinutes

  // Season stations: count sessions per month across all programs.
  const seasonYear = currentSeasonStartYear(now, tz)
  const keys = seasonMonthKeys(seasonYear)
  const seasonSessions = await listSessionsInRange(
    locale,
    `${keys[0]}-01T00:00:00.000Z`,
    `${seasonYear + 1}-05-01T00:00:00.000Z`,
  )
  const counts = new Map<string, number>()
  for (const s of seasonSessions)
    counts.set(
      monthKeyInZone(s.startsAt, tz),
      (counts.get(monthKeyInZone(s.startsAt, tz)) ?? 0) + 1,
    )
  const nowKey = monthKeyInZone(now, tz)
  const stations: Station[] = keys.map((key) => ({
    key,
    label: formatInZone(`${key}-15T12:00:00.000Z`, locale, tz).month,
    count: counts.get(key) ?? 0,
    isCurrent: key === nowKey,
    isPast: key < nowKey,
  }))

  const open = programs.filter((p) => p.track === 'open')
  const directed = programs.filter((p) => p.track !== 'open')
  const next = upcoming[0] ? sessionView(upcoming[0], locale, tz, win, t, now) : null
  const heroTitle = home.heroTitle || t('home.heroTitle')
  const hero = parseAccent(heroTitle)
  const heroImage = mediaImage(home.heroImage, 'hero')
  const heroCutout = mediaImage(home.heroCutout, 'hero')
  // Two switches on purpose: Site settings holds the figures and the master toggle
  // ("keep off until real numbers exist"); the home page decides whether to show the band.
  const stats = (settings.stats ?? []).filter((s) => s.value?.trim() && s.label?.trim())
  const showStats = !!home.showStats && !!settings.statsEnabled && stats.length > 0

  return (
    <>
      {/* 1 · Hero */}
      <section className="relative overflow-hidden surface-navy-blue">
        {/* Three layers: the photograph, the cascade, then the same photo without its
            background — so the cascade passes behind the subject and in front of the sky. */}
        {heroImage ? (
          <div
            aria-hidden
            className={cn('absolute inset-0', HERO_BOX)}
            style={{ maskImage: HERO_EDGE }}
          >
            <DuotoneImage
              src={heroImage.src}
              alt=""
              fill
              priority
              fade="bottom"
              anchor="top-end"
              sizes="(min-width: 768px) 60vw, 100vw"
              className="h-full w-full"
            />
          </div>
        ) : null}
        <LivingCascade className={heroImage && !heroCutout ? 'opacity-60' : undefined} />
        {heroImage && heroCutout ? (
          // The same photograph again, masked to the subject's silhouette, so the subject
          // looks exactly like the layer below it and simply covers the cascade.
          // A CSS mask has no srcset, so the width is chosen by breakpoint: 1920 only on
          // wide frames, 1080 below (still finer than the ~750 px photo a phone gets).
          // Every phone used to fetch the 1920 file, and the masked layer — the hero's
          // largest paint — waited for it (live Lighthouse, 2026-09-24: 113 kB, 4.4 s).
          // Preloaded per breakpoint in CORS mode, the mode a mask image is fetched in.
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 mask-intersect mask-cover mask-position-[35%_0%] mask-no-repeat rtl:mask-position-[65%_0%]',
              '[--cutout:var(--cutout-sm)] xl:[--cutout:var(--cutout-xl)]',
              HERO_BOX,
            )}
            style={
              {
                '--cutout-sm': `url(${optimizedImageUrl(heroCutout.src, 1080)})`,
                '--cutout-xl': `url(${optimizedImageUrl(heroCutout.src, 1920)})`,
                maskImage: `var(--cutout), ${HERO_EDGE}`,
              } as React.CSSProperties
            }
          >
            <link
              rel="preload"
              as="image"
              href={optimizedImageUrl(heroCutout.src, 1080)}
              media={`(max-width: ${CUTOUT_XL - 0.02}px)`}
              crossOrigin="anonymous"
              fetchPriority="high"
            />
            <link
              rel="preload"
              as="image"
              href={optimizedImageUrl(heroCutout.src, 1920)}
              media={`(min-width: ${CUTOUT_XL}px)`}
              crossOrigin="anonymous"
              fetchPriority="high"
            />
            <DuotoneImage
              src={heroImage.src}
              alt=""
              fill
              priority
              fade="bottom"
              anchor="top-end"
              sizes="(min-width: 768px) 60vw, 100vw"
              className="h-full w-full"
            />
          </div>
        ) : null}
        {/* Phones only: the copy sits over the photograph there, and white text on the dome's
            highlights measured 1.19:1 (2026-09-25; WCAG asks 4.5:1). A navy scrim rises from
            the foot, dense where the text is. Wide frames keep the copy beside the photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-navy-900/95 via-navy-900/80 to-navy-900/10 md:hidden"
        />
        <div className="relative container-site flex min-h-[78vh] flex-col justify-end py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-medium text-on-navy-muted">{t('site.name')}</p>
            <h1 className="mt-5 text-4xl text-on-navy">
              {hero.map((s, i) => (
                <span
                  key={i}
                  className={
                    s.accent
                      ? 'underline decoration-red-600 decoration-[0.06em] underline-offset-[0.16em]'
                      : undefined
                  }
                >
                  {s.text}
                </span>
              ))}
            </h1>
            <p className="mt-8 max-w-[34rem] text-base text-on-navy-muted">
              {home.heroSubtitle || t('site.mission')}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/programs" size="lg">
                {home.primaryCtaLabel || t('home.exploreCta')}
              </ButtonLink>
              <ButtonLink href="/apply" size="lg" variant="onNavy">
                {home.secondaryCtaLabel || t('home.applyCta')}
              </ButtonLink>
            </div>
          </div>
          {home.showNextSession !== false ? (
            <div className="mt-14 border-t border-on-navy-line pt-6 md:mt-20">
              {next ? (
                <Link
                  href={next.href as never}
                  className="group inline-flex flex-wrap items-baseline gap-x-4 gap-y-1 text-on-navy"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-on-navy-muted">
                    <span
                      aria-hidden
                      className={
                        next.state === 'live' || next.state === 'starting-soon'
                          ? 'live-dot size-1.5 rounded-full bg-red-600'
                          : 'size-1.5 rounded-full bg-red-600'
                      }
                    />
                    {t('home.nextSession')}
                  </span>
                  <span className="text-sm text-on-navy-muted">{next.programTitle}</span>
                  <span className="link-grow relative font-semibold">{next.title}</span>
                  <span className="text-sm text-on-navy-muted tabular-nums">
                    {next.parts.dateTime} · {t('common.alQudsTime')}
                  </span>
                </Link>
              ) : null}
              {next?.joinUrl ? (
                <ButtonLink
                  href={next.joinUrl as never}
                  size="sm"
                  className="ms-6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('session.joinNow')}
                </ButtonLink>
              ) : null}
              {!next ? (
                <p className="text-sm text-on-navy-muted">{t('home.nextSessionEmpty')}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* 2 · Mission & pillars */}
      {home.showMission !== false ? (
        <section className="section-y">
          <div className="container-site grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionHeading
                locale={locale}
                ordinal={ordinalFor(0, t)}
                title={t('home.missionTitle')}
              />
            </div>
            <div className="md:col-span-7">
              <p className="text-lg leading-relaxed text-balance text-ink-900">
                {t('site.mission')}
              </p>
              <ul className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
                {(['educational', 'cognitive', 'political'] as const).map((k, i) => (
                  <li key={k}>
                    <span className="text-xs text-ink-500">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="mt-2 text-md">{t(`home.pillars.${k}.title`)}</h3>
                    <p className="mt-2 text-sm text-ink-700">{t(`home.pillars.${k}.text`)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* 2b · Statistics band — off until real figures exist (Site settings → Statistics) */}
      {showStats ? (
        <section className="pattern-marks-navy surface-navy">
          <div className="container-site py-14 md:py-20">
            <h2 className="sr-only">{t('home.statsTitle')}</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.id ?? i} className="border-t border-on-navy-line pt-5">
                  <dd className="text-3xl font-bold text-on-navy tabular-nums" dir="ltr">
                    {s.value}
                  </dd>
                  <dt className="mt-2 text-sm text-on-navy-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* 3 · Programs */}
      {home.showPrograms !== false && programs.length ? (
        <section className="bg-paper-2 section-y">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                locale={locale}
                ordinal={ordinalFor(1, t)}
                title={t('home.programsTitle')}
                intro={t('home.programsIntro')}
              />
              <TextLink href="/programs" className="mb-1">
                {t('home.allPrograms')}
              </TextLink>
            </div>
            <div className="mt-12 grid gap-4">
              {open.map((p) => (
                <ProgramCard
                  key={p.id}
                  featured
                  href={`/programs/${p.slug}`}
                  title={p.title}
                  image={mediaImage(p.coverImage, 'card')}
                  description={p.shortDescription}
                  trackLabel={t('home.openTrackLabel')}
                  registration={registrationBadge(p.registrationMode, t)}
                  sessionsLabel={sessionsCountLabel(p, t)}
                  seasonLabel={season(p)}
                  featuredCta={t('common.readMore')}
                />
              ))}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                {directed.map((p, i) => (
                  <ProgramCard
                    key={p.id}
                    href={`/programs/${p.slug}`}
                    title={p.title}
                    image={mediaImage(p.coverImage, 'card')}
                    description={p.shortDescription}
                    ordinal={String(i + 1).padStart(2, '0')}
                    trackLabel={trackLabel(p.track, t)}
                    registration={registrationBadge(p.registrationMode, t)}
                    sessionsLabel={sessionsCountLabel(p, t)}
                    seasonLabel={season(p)}
                    motif={p.accentMotif}
                    className={i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4 · The season */}
      {home.showSeason !== false ? (
        <section className="section-y">
          <div className="container-site">
            <SectionHeading
              locale={locale}
              ordinal={ordinalFor(2, t)}
              title={t('home.seasonTitle')}
              intro={t('home.seasonIntro')}
            />
            <div className="mt-14">
              <SeasonTimeline
                stations={stations}
                sessionsLabel={(n) => t('common.sessions', { count: n })}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* 5 · Upcoming sessions */}
      {home.showUpcoming !== false ? (
        <section className="border-t border-line section-y">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                locale={locale}
                ordinal={ordinalFor(3, t)}
                title={t('home.upcomingTitle')}
                intro={t('home.upcomingIntro')}
              />
              <TextLink href="/schedule" className="mb-1">
                {t('home.viewSchedule')}
              </TextLink>
            </div>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {upcoming.length ? (
                upcoming.map((s) => {
                  const v = sessionView(s, locale, tz, win, t, now)
                  return (
                    <SessionRow
                      key={v.id}
                      locale={locale}
                      academyZone={tz}
                      iso={v.iso}
                      parts={v.parts}
                      state={v.state}
                      stateLabel={v.stateLabel}
                      programTitle={v.programTitle}
                      programHref={v.programHref}
                      title={v.title}
                      href={v.href}
                      instructor={v.instructor}
                      alQudsLabel={t('session.alQuds')}
                      localLabel={t('session.local')}
                    />
                  )
                })
              ) : (
                <EmptyState className="my-6 border-0" title={t('home.nextSessionEmpty')} />
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* 6 · The Camp */}
      {home.showCamp !== false && camp ? (
        <section className="pattern-marks-navy surface-navy">
          <div className="container-site grid gap-10 section-y md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <SectionHeading
                locale={locale}
                onNavy
                ordinal={ordinalFor(4, t)}
                title={t('home.campTitle')}
                intro={camp.summary || t('home.campIntro')}
              />
            </div>
            <div className="md:col-span-5 md:text-end">
              <ButtonLink href={`/events/${camp.slug}`} variant="onNavy" size="lg">
                {t('home.campCta')}
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      {/* 7 · From Minbar — hidden when empty */}
      {home.showMinbar !== false && posts.length ? (
        <section className="section-y">
          <div className="container-site">
            <SectionHeading
              locale={locale}
              ordinal={ordinalFor(5, t)}
              title={t('home.minbarTitle')}
            />
            <ul className="mt-12 grid gap-8 md:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id} className="border-t border-line pt-5">
                  <span className="text-xs text-ink-500">
                    {formatInZone(p.publishedAt, locale, tz).date}
                  </span>
                  <h3 className="mt-2 text-md">
                    <TextLink href={`/knowledge/minbar/${p.slug}`}>{p.title}</TextLink>
                  </h3>
                  {p.excerpt ? <p className="mt-2 text-sm text-ink-700">{p.excerpt}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 8 · Instructors — hidden when empty */}
      {home.showInstructors !== false && instructors.length ? (
        <section className="bg-paper-2 section-y">
          <div className="container-site">
            <SectionHeading
              locale={locale}
              ordinal={ordinalFor(6, t)}
              title={t('home.instructorsTitle')}
            />
            <ul className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
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
          </div>
        </section>
      ) : null}

      {/* 9 · Closing CTA */}
      <section className="section-y hairline-t">
        <Reveal className="container-reading flex flex-col items-center text-center">
          <SectionHeading
            locale={locale}
            align="center"
            title={home.closingTitle || t('home.closingTitle')}
            intro={home.closingText || t('home.closingText')}
          />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/apply" size="lg">
              {t('nav.apply')}
            </ButtonLink>
            <ButtonLink href="/programs" size="lg" variant="secondary">
              {t('home.allPrograms')}
            </ButtonLink>
          </div>
          <p className="sr-only">{stripAccent(heroTitle)}</p>
        </Reveal>
      </section>
    </>
  )
}
