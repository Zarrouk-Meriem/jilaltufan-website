import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageIntro } from '@/components/sections/PageIntro'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { getSiteSettings, listMinbarPosts } from '@/lib/queries'
import { formatInZone } from '@/lib/time'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/knowledge/minbar'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'knowledge' })
  return {
    alternates: alternatesFor(locale as Locale, '/knowledge/minbar'),
    title: t('minbarTitle'),
    description: t('minbarIntro'),
  }
}

export default async function MinbarIndex({ params }: PageProps<'/[locale]/knowledge/minbar'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const [settings, posts] = await Promise.all([
    getSiteSettings(locale),
    listMinbarPosts(locale, 100),
  ])
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('knowledge.minbarTitle')}
        intro={t('knowledge.minbarIntro')}
        ordinal={t('nav.knowledge')}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[
          { label: t('nav.knowledge'), href: '/knowledge' },
          { label: t('knowledge.minbarTitle') },
        ]}
      />
      <div className="container-site py-14 md:py-20">
        {posts.length ? (
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id} className="border-t border-line pt-5">
                <span className="text-xs text-ink-500">
                  {formatInZone(p.publishedAt, locale, settings.academyTimeZone).date}
                </span>
                <h2 className="mt-2 text-md">
                  <TextLink href={`/knowledge/minbar/${p.slug}`}>{p.title}</TextLink>
                </h2>
                {p.excerpt ? <p className="mt-2 text-sm text-ink-700">{p.excerpt}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('knowledge.minbarEmpty')} />
        )}
      </div>
    </>
  )
}
