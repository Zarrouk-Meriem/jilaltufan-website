import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Prose } from '@/components/content/Prose'
import { PageIntro } from '@/components/sections/PageIntro'
import { Badge } from '@/components/ui/Badge'
import { TextLink } from '@/components/ui/TextLink'
import { routing, type Locale } from '@/i18n/routing'
import { getProjectBySlug, listProjectSlugs } from '@/lib/queries'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listProjectSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projects/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getProjectBySlug(locale as Locale, slug)
  if (!p) return {}
  return {
    alternates: alternatesFor(locale as Locale, `/projects/${slug}`),
    title: p.seo?.title || p.title,
    description: p.seo?.description || p.summary || undefined,
  }
}

export default async function ProjectPage({ params }: PageProps<'/[locale]/projects/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()
  const project = await getProjectBySlug(locale, slug)
  if (!project) notFound()
  return (
    <>
      <PageIntro
        locale={locale}
        title={project.title}
        intro={project.summary}
        ordinal={t('nav.projects')}
        crumbLabel={t('common.breadcrumb')}
        crumbs={[
          { label: t('nav.academy'), href: '/about' },
          { label: t('nav.projects'), href: '/projects' },
          { label: project.title },
        ]}
      >
        <div className="mt-8">
          <Badge tone={project.projectStatus === 'ongoing' ? 'neutral' : 'muted'}>
            {t(`projects.${project.projectStatus ?? 'ongoing'}` as 'projects.ongoing')}
          </Badge>
        </div>
      </PageIntro>
      <div className="container-site py-14 md:py-20">
        <Prose data={project.body} size="md" />
        <p className="mt-14">
          <TextLink href="/projects">{t('projects.allProjects')}</TextLink>
        </p>
      </div>
    </>
  )
}
