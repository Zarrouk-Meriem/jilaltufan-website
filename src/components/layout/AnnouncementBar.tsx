import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/queries'

/**
 * Site-wide notice from Site settings → Announcement bar. Sits under the header, never
 * above it (the header stays one row). Server-only: no dismiss state, no client JS.
 */
export async function AnnouncementBar({ locale }: { locale: Locale }) {
  const [settings, t] = await Promise.all([getSiteSettings(locale), getTranslations('a11y')])
  const text = settings.announcementText?.trim()
  if (!settings.announcementEnabled || !text) return null
  const href = settings.announcementLink?.trim()
  const external = !!href && /^https?:\/\//.test(href)
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight
  const body = (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span aria-hidden className="inline-block h-4 w-0.5 shrink-0 bg-red-600" />
      <span className="text-sm font-medium text-ink-900">{text}</span>
      {href ? <Arrow aria-hidden strokeWidth={1.5} className="size-4 text-red-700" /> : null}
    </span>
  )
  return (
    <section aria-label={t('announcement')} className="border-b border-line bg-paper-2">
      <div className="container-site flex min-h-11 items-center py-2">
        {href ? (
          external ? (
            <a href={href} className="link-grow relative" target="_blank" rel="noopener noreferrer">
              {body}
            </a>
          ) : (
            <Link href={href as never} className="link-grow relative">
              {body}
            </Link>
          )
        ) : (
          body
        )}
      </div>
    </section>
  )
}
