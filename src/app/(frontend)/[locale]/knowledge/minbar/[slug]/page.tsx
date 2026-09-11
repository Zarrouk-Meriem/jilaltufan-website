import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Prose } from '@/components/content/Prose'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { DuotoneImage } from '@/components/ui/DuotoneImage'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import { routing, type Locale } from '@/i18n/routing'
import { getMinbarPostBySlug, getSiteSettings, listMinbarSlugs } from '@/lib/queries'
import { rel } from '@/lib/relations'
import { formatInZone } from '@/lib/time'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listMinbarSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/knowledge/minbar/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getMinbarPostBySlug(locale as Locale, slug)
  if (!p) return {}
  return {
    alternates: alternatesFor(locale as Locale, `/knowledge/minbar/${slug}`),
    title: p.seo?.title || p.title,
    description: p.seo?.description || p.excerpt || undefined,
  }
}

export default async function MinbarPostPage({
  params,
}: PageProps<'/[locale]/knowledge/minbar/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const post = await getMinbarPostBySlug(locale, slug)
  if (!post) notFound()
  const settings = await getSiteSettings(locale)
  const author = rel(post.author)
  const cover = rel(post.cover)
  const authorName = author?.name ?? post.authorName
  return (
    <article>
      <header className="hairline-b">
        <div className="container-reading pt-10 pb-12 md:pt-14 md:pb-16">
          <Breadcrumbs
            label={t('common.breadcrumb')}
            className="mb-8"
            items={[
              { label: t('nav.knowledge'), href: '/knowledge' },
              { label: t('knowledge.minbarTitle'), href: '/knowledge/minbar' },
              { label: post.title },
            ]}
          />
          <SectionHeading
            as="h1"
            locale={locale}
            title={post.title}
            ordinal={formatInZone(post.publishedAt, locale, settings.academyTimeZone).date}
            intro={post.excerpt ?? undefined}
            className="[&_h1]:text-3xl"
          />
          {authorName ? (
            <p className="mt-8 text-sm text-ink-500">
              {t('knowledge.by')}{' '}
              {author ? (
                <TextLink href={`/instructors/${author.slug}`}>{author.name}</TextLink>
              ) : (
                <span className="text-ink-900">{authorName}</span>
              )}
            </p>
          ) : null}
        </div>
      </header>
      {cover?.url ? (
        <div className="container-site mt-10">
          <DuotoneImage
            src={cover.url}
            alt={cover.alt}
            width={cover.width ?? 1600}
            height={cover.height ?? 900}
            className="aspect-[16/7] w-full"
            sizes="100vw"
            priority
          />
        </div>
      ) : null}
      <div className="container-reading py-14 md:py-20">
        <Prose data={post.body} size="md" />
        {post.tags?.length ? (
          <ul className="mt-12 flex flex-wrap gap-2" aria-label={t('knowledge.tags')}>
            {post.tags.map((tg, i) => (
              <li key={tg.id ?? i}>
                <Badge tone="muted">{tg.tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-12">
          <TextLink href="/knowledge/minbar">{t('knowledge.allPosts')}</TextLink>
        </p>
      </div>
    </article>
  )
}
