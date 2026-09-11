import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

/** Shareable filter: plain links carrying ?program=slug. Server-rendered, no JS. */
export function ProgramFilter({
  label,
  allLabel,
  items,
  current,
  basePath,
}: {
  label: string
  allLabel: string
  items: { slug: string; title: string }[]
  current?: string
  basePath: string
}) {
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-9 items-center rounded-brand border px-3.5 text-sm transition-colors duration-150',
      active
        ? 'border-ink-900 bg-ink-900 text-white'
        : 'border-line text-ink-700 hover:border-ink-900 hover:text-ink-900',
    )
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      <Link
        href={basePath as never}
        aria-current={!current ? 'page' : undefined}
        className={chip(!current)}
      >
        {allLabel}
      </Link>
      {items.map((p) => (
        <Link
          key={p.slug}
          href={`${basePath}?program=${p.slug}` as never}
          aria-current={current === p.slug ? 'page' : undefined}
          className={chip(current === p.slug)}
        >
          {p.title}
        </Link>
      ))}
    </nav>
  )
}
