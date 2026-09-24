'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

export type PortalNavItem = { href: string; label: string }

/**
 * The portal's own navigation. Separate from the marketing menu on purpose: someone signed
 * in is not browsing the academy, they are inside their own record, and a nav offering them
 * «البرامج» and «قدّم الآن» was the confusion this portal was split out to end.
 *
 * The current section is marked by weight and a solid start-edge rule rather than by the
 * mark, which is never a small UI indicator (CLAUDE.md).
 */
export function PortalNav({
  items,
  className,
  orientation = 'vertical',
}: {
  items: PortalNavItem[]
  className?: string
  orientation?: 'vertical' | 'horizontal'
}) {
  const pathname = usePathname()
  const isCurrent = (href: string) =>
    href === '/account' ? pathname === '/account' : pathname.startsWith(href)

  return (
    <nav
      className={cn(
        orientation === 'vertical'
          ? 'flex flex-col gap-0.5'
          : // A row that scrolls on a phone rather than wrapping into a block of links.
            'flex [scrollbar-width:none] gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {items.map((item) => {
        const current = isCurrent(item.href)
        return (
          <Link
            key={item.href}
            href={item.href as never}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'relative rounded-brand text-sm whitespace-nowrap transition-colors duration-150 ease-brand',
              orientation === 'vertical' ? 'py-2.5 ps-4 pe-3' : 'px-3 py-2',
              current
                ? 'font-semibold text-on-navy'
                : 'font-medium text-on-navy/70 hover:bg-white/8 hover:text-on-navy',
            )}
          >
            {current && orientation === 'vertical' ? (
              <span
                aria-hidden
                className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-red-600"
              />
            ) : null}
            {current && orientation === 'horizontal' ? (
              <span aria-hidden className="absolute start-3 end-3 bottom-0 h-0.5 bg-red-600" />
            ) : null}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
