import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MaterialRow } from '@/components/sections/MaterialRow'
import { PageIntro } from '@/components/sections/PageIntro'
import { ProgramFilter } from '@/components/sections/ProgramFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Locale } from '@/i18n/routing'
import { listMaterials, listPrograms } from '@/lib/queries'
import { rel } from '@/lib/relations'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/knowledge/materials'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'knowledge' })
  return {
    alternates: alternatesFor(locale as Locale, '/knowledge/materials'),
    title: t('materialsTitle'),
    description: t('materialsIntro'),
  }
}

export default async function MaterialsPage({
  params,
  searchParams,
}: PageProps<'/[locale]/knowledge/materials'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const sp = await searchParams
  const programSlug = typeof sp.program === 'string' ? sp.program : undefined
  const t = await getTranslations()
  const [programs, materials] = await Promise.all([
    listPrograms(locale),
    listMaterials(locale, programSlug),
  ])
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('knowledge.materialsTitle')}
        intro={t('knowledge.materialsIntro')}
        ordinal={t('nav.knowledge')}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[
          { label: t('nav.knowledge'), href: '/knowledge' },
          { label: t('knowledge.materialsTitle') },
        ]}
      >
        <div className="mt-8">
          <ProgramFilter
            label={t('knowledge.filterLabel')}
            allLabel={t('knowledge.allPrograms')}
            basePath="/knowledge/materials"
            current={programSlug}
            items={programs.map((p) => ({ slug: p.slug, title: p.title }))}
          />
        </div>
      </PageIntro>
      <div className="container-site py-14 md:py-20">
        {materials.length ? (
          <div className="divide-y divide-line border-y border-line">
            {materials.map((m) => {
              const file = rel(m.file)
              const program = rel(m.program)
              return (
                <MaterialRow
                  key={m.id}
                  title={m.title}
                  type={m.type}
                  typeLabel={t(`knowledge.${m.type}` as 'knowledge.pdf')}
                  href={m.type === 'pdf' ? file?.url : m.url}
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
    </>
  )
}
