import { Icon } from '@/components/icons/Icon'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({
  items,
  label,
  className,
}: {
  items: Crumb[]
  label: string
  className?: string
}) {
  return (
    <nav aria-label={label} className={cn('text-sm text-ink-500', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href as never} className="link-grow relative text-ink-700">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={last ? 'text-ink-900' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last ? <Icon name="chevron" direction="forward" className="size-4" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
