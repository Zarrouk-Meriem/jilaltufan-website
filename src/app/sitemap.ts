import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import {
  listEventSlugs,
  listInstructorSlugs,
  listMinbarSlugs,
  listProgramSlugs,
  listProjectSlugs,
} from '@/lib/queries'
import { SITE_URL } from '@/lib/site'

const STATIC = [
  '',
  '/about',
  '/about/structure',
  '/programs',
  '/schedule',
  '/events',
  '/projects',
  '/knowledge',
  '/knowledge/minbar',
  '/knowledge/materials',
  '/instructors',
  '/students',
  '/apply',
  '/contact',
  '/privacy',
  '/terms',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programs, events, projects, instructors, posts] = await Promise.all([
    listProgramSlugs(),
    listEventSlugs(),
    listProjectSlugs(),
    listInstructorSlugs(),
    listMinbarSlugs(),
  ])
  const paths = [
    ...STATIC,
    ...programs.map((s) => `/programs/${s}`),
    ...events.map((s) => `/events/${s}`),
    ...projects.map((s) => `/projects/${s}`),
    ...instructors.map((s) => `/instructors/${s}`),
    ...posts.map((s) => `/knowledge/minbar/${s}`),
  ]
  const now = new Date()
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency:
        path === '' || path === '/schedule' ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1 : path.startsWith('/programs') ? 0.9 : 0.6,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      },
    })),
  )
}
