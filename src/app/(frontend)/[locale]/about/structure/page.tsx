import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Prose } from '@/components/content/Prose'
import { PageIntro } from '@/components/sections/PageIntro'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { getAboutPage } from '@/lib/queries'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/about/structure'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    alternates: alternatesFor(locale as Locale, '/about/structure'),
    title: t('structureTitle'),
  }
}

export default async function StructurePage({ params }: PageProps<'/[locale]/about/structure'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const about = await getAboutPage(locale)
  const units = about.structure ?? []
  const kindLabel = (k?: string | null) =>
    k === 'team' ? t('about.team') : k === 'committee' ? t('about.committee') : t('about.council')

  return (
    <>
      <PageIntro
        locale={locale}
        title={t('about.structureTitle')}
        ordinal={t('nav.academy')}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[{ label: t('nav.academy'), href: '/about' }, { label: t('about.structureLink') }]}
      />
      <div className="container-site py-14 md:py-20">
        {about.structureIntro ? (
          <Prose data={about.structureIntro} size="md" className="mb-14" />
        ) : null}
        {units.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {units.map((u, i) => (
              <li key={u.id ?? i} className="rounded-brand border border-line p-7 md:p-8">
                <span className="text-xs font-medium text-ink-500">{kindLabel(u.kind)}</span>
                <h2 className="mt-2 text-lg">{u.name}</h2>
                {u.description ? (
                  <p className="mt-3 measure text-ink-700">{u.description}</p>
                ) : null}
                {u.members?.length ? (
                  <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
                    {u.members.map((m, j) => (
                      <li
                        key={m.id ?? j}
                        className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
                      >
                        <span className="font-medium text-ink-900">{m.name}</span>
                        {m.role ? <span className="text-ink-500">{m.role}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('about.structureEmpty')} />
        )}
      </div>
    </>
  )
}
