import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageIntro } from '@/components/sections/PageIntro'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { listProjects } from '@/lib/queries'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projects'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  return { title: stripAccent(t('title')), description: t('intro') }
}

export default async function ProjectsPage({ params }: PageProps<'/[locale]/projects'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const projects = await listProjects(locale)
  return (
    <>
      <PageIntro
        locale={locale}
        title={t('projects.title')}
        intro={t('projects.intro')}
        ordinal={t('nav.academy')}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[{ label: t('nav.academy'), href: '/about' }, { label: t('nav.projects') }]}
      />
      <div className="container-site py-14 md:py-20">
        {projects.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.slug}` as never}
                  className="group flex h-full flex-col rounded-brand border border-line p-7 transition-[border-color] duration-200 hover:border-ink-900"
                >
                  <Badge tone={p.projectStatus === 'ongoing' ? 'neutral' : 'muted'}>
                    {t(`projects.${p.projectStatus ?? 'ongoing'}` as 'projects.ongoing')}
                  </Badge>
                  <h2 className="mt-5 text-lg">
                    <span className="link-grow relative">{p.title}</span>
                  </h2>
                  {p.summary ? <p className="mt-3 measure text-ink-700">{p.summary}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('projects.empty')} />
        )}
      </div>
    </>
  )
}
