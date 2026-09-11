import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Prose } from '@/components/content/Prose'
import { PageIntro } from '@/components/sections/PageIntro'
import { SessionRow } from '@/components/sections/SessionRow'
import { DuotoneImage } from '@/components/ui/DuotoneImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import { routing, type Locale } from '@/i18n/routing'
import {
  getInstructorBySlug,
  getSiteSettings,
  listInstructorSlugs,
  listSchedule,
} from '@/lib/queries'
import { rel, rels } from '@/lib/relations'
import { sessionView } from '@/lib/view'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await listInstructorSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/instructors/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const i = await getInstructorBySlug(locale as Locale, slug)
  if (!i) return {}
  return {
    title: i.seo?.title || i.name,
    description: i.seo?.description || i.shortBio || undefined,
  }
}

export default async function InstructorPage({
  params,
}: PageProps<'/[locale]/instructors/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const instructor = await getInstructorBySlug(locale, slug)
  if (!instructor) notFound()
  const settings = await getSiteSettings(locale)
  const tz = settings.academyTimeZone
  const now = new Date()
  const all = await listSchedule(locale, undefined, now)
  const mine = all
    .filter(
      (s) =>
        rels(s.instructors).some((i) => i.id === instructor.id) &&
        new Date(s.startsAt).getTime() >= now.getTime(),
    )
    .slice(0, 8)
  const programs = (instructor.programs?.docs ?? [])
    .map((d) => (typeof d === 'object' ? d : null))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const photo = rel(instructor.photo)

  return (
    <>
      <PageIntro
        locale={locale}
        title={instructor.name}
        intro={instructor.shortBio}
        ordinal={instructor.role ?? t('nav.instructors')}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[{ label: t('nav.instructors'), href: '/instructors' }, { label: instructor.name }]}
      />
      <div className="container-site grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="aspect-[4/5] overflow-hidden rounded-brand surface-navy">
            {photo?.url ? (
              <DuotoneImage
                src={photo.url}
                alt={photo.alt}
                width={photo.width ?? 600}
                height={photo.height ?? 750}
                className="h-full w-full"
                sizes="(min-width: 768px) 25vw, 100vw"
              />
            ) : null}
          </div>
          {instructor.links?.length ? (
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {instructor.links.map((l, i) => (
                <li key={l.id ?? i}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-grow relative text-ink-900"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
        <div className="flex flex-col gap-16 md:col-span-8 lg:col-start-5">
          {instructor.bio ? <Prose data={instructor.bio} size="md" /> : null}
          {programs.length ? (
            <section>
              <SectionHeading locale={locale} size="md" title={t('instructors.profilePrograms')} />
              <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {programs.map((p) => (
                  <li key={p.id}>
                    <TextLink href={`/programs/${p.slug}`}>{p.title}</TextLink>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <SectionHeading locale={locale} size="md" title={t('instructors.profileSessions')} />
            <div className="mt-6">
              {mine.length ? (
                <div className="divide-y divide-line border-y border-line">
                  {mine.map((s) => {
                    const v = sessionView(s, locale, tz, settings.joinWindowMinutes, t, now)
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
                        alQudsLabel={t('session.alQuds')}
                        localLabel={t('session.local')}
                        calendar={v.calendar}
                      />
                    )
                  })}
                </div>
              ) : (
                <EmptyState title={t('instructors.noUpcoming')} />
              )}
            </div>
          </section>
          <p>
            <TextLink href="/instructors">{t('instructors.allInstructors')}</TextLink>
          </p>
        </div>
      </div>
    </>
  )
}
