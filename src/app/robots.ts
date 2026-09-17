import type { MetadataRoute } from 'next'
import { SITE_NOINDEX, SITE_URL } from '@/lib/site'

export function robotsFor(noindex: boolean, siteUrl: string): MetadataRoute.Robots {
  if (noindex) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*/styleguide'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}

export default function robots(): MetadataRoute.Robots {
  return robotsFor(SITE_NOINDEX, SITE_URL)
}
