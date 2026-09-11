'use client'

import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { Link, usePathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'

/**
 * Keeps the visitor on the equivalent page in the other locale.
 * Pass `alternates` when the slug differs per locale (set at page level).
 */
export function LanguageSwitch({
  label,
  className,
  tone = 'ink',
  alternates,
}: {
  label: string
  className?: string
  tone?: 'ink' | 'muted' | 'onNavy'
  alternates?: Partial<Record<Locale, string>>
}) {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const params = useParams()
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale
  const href = alternates?.[other] ?? pathname
  const otherLabel = other === 'ar' ? 'العربية' : 'English'

  return (
    <Link
      href={href as never}
      locale={other}
      // @ts-expect-error dynamic params are forwarded as-is
      params={params}
      hrefLang={other}
      lang={other}
      dir={other === 'ar' ? 'rtl' : 'ltr'}
      aria-label={`${label}: ${otherLabel}`}
      className={cn(
        'link-grow relative h-9 items-center text-sm font-medium',
        tone === 'ink' && 'text-ink-900',
        tone === 'muted' && 'font-normal text-ink-500 hover:text-ink-900',
        tone === 'onNavy' && 'text-on-navy',
        className,
      )}
    >
      {otherLabel}
    </Link>
  )
}
