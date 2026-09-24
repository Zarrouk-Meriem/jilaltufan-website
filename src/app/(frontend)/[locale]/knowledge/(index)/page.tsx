import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MaterialRow } from '@/components/sections/MaterialRow'
import { PageIntro } from '@/components/sections/PageIntro'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getSiteSettings, listMaterials, listMinbarPosts } from '@/lib/queries'
import { materialFileUrl } from '@/lib/materials'
import { rel } from '@/lib/relations'
import { formatInZone } from '@/lib/time'
import { ordinalFor } from '@/lib/view'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/knowledge'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'knowledge' })
  return {
    alternates: alternatesFor(locale as Locale, '/knowledge'),
    title: stripAccent(t('title')),
    description: t('intro'),
  }
}

export default async function KnowledgePage({ params }: PageProps<'/[locale]/knowledge'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const [settings, posts, materials] = await Promise.all([
    getSiteSettings(locale),
    listMinbarPosts(locale, 6),
    listMaterials(locale),
  ])
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('knowledge.title')}
        intro={t('knowledge.intro')}
        ordinal={t('nav.knowledge')}
      />
      <div className="container-site flex flex-col gap-20 py-14 md:py-20">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(0, t)}
              title={t('knowledge.minbarTitle')}
              intro={t('knowledge.minbarIntro')}
            />
            <TextLink href="/knowledge/minbar" className="mb-1">
              {t('knowledge.allPosts')}
            </TextLink>
          </div>
          <div className="mt-10">
            {posts.length ? (
              <ul className="grid gap-8 md:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.id} className="border-t border-line pt-5">
                    <span className="text-xs text-ink-500">
                      {formatInZone(p.publishedAt, locale, settings.academyTimeZone).date}
                    </span>
                    <h3 className="mt-2 text-md">
                      <TextLink href={`/knowledge/minbar/${p.slug}`}>{p.title}</TextLink>
                    </h3>
                    {p.excerpt ? <p className="mt-2 text-sm text-ink-700">{p.excerpt}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('knowledge.minbarEmpty')} />
            )}
          </div>
        </section>
        <section>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              locale={locale}
              size="md"
              ordinal={ordinalFor(1, t)}
              title={t('knowledge.materialsTitle')}
              intro={t('knowledge.materialsIntro')}
            />
            <TextLink href="/knowledge/materials" className="mb-1">
              {t('knowledge.allMaterials')}
            </TextLink>
          </div>
          <div className="mt-10">
            {materials.length ? (
              <div className="divide-y divide-line border-y border-line">
                {materials.slice(0, 6).map((m) => {
                  const program = rel(m.program)
                  return (
                    <MaterialRow
                      key={m.id}
                      title={m.title}
                      type={m.type}
                      typeLabel={t(`knowledge.${m.type}` as 'knowledge.pdf')}
                      href={m.type === 'pdf' ? materialFileUrl(m) : m.url}
                      description={m.description}
                      programTitle={program?.title}
                      actionLabel={m.type === 'pdf' ? t('knowledge.download') : t('knowledge.open')}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState title={t('knowledge.materialsEmpty')} />
            )}
          </div>
        </section>
      </div>
    </>
  )
}
