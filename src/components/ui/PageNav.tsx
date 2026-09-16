'use client'

import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

export type PageNavItem = { id: string; title: string }

/**
 * "On this page" navigation for long reading pages. Desktop: a sticky rail whose
 * red indicator slides to the section in view (state by colour, weight, and a
 * hairline, never by the mark). Phones: one scrollable row of angular chips above
 * the content. Reduced motion removes the slide.
 */
export function PageNav({
  label,
  items,
  extra,
  className,
}: {
  label: string
  items: PageNavItem[]
  /** A related page, set apart under a hairline. */
  extra?: { href: string; label: string }
  className?: string
}) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const listRef = useRef<HTMLUListElement>(null)
  const [indicator, setIndicator] = useState<CSSProperties>({ opacity: 0 })

  // Which section is in view: the top-most heading past the upper third of the viewport.
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((x): x is HTMLElement => !!x)
    if (!els.length) return
    const pick = () => {
      const line = window.innerHeight * 0.3
      let current = els[0]!.id
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id
      setActive(current)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('resize', pick)
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('resize', pick)
    }
  }, [items])

  // Move the indicator to the active link (measured, so wrapped titles stay covered).
  useEffect(() => {
    const list = listRef.current
    const link = list?.querySelector<HTMLElement>(`[data-id="${active}"]`)
    if (!list || !link) return
    setIndicator({
      transform: `translateY(${link.offsetTop}px)`,
      height: link.offsetHeight,
      opacity: 1,
    })
  }, [active])

  return (
    <nav aria-label={label} className={cn('md:sticky md:top-28', className)}>
      {/* Phone: chips */}
      <ul className="-mx-[var(--gutter)] flex [scrollbar-width:none] gap-2 overflow-x-auto px-[var(--gutter)] pb-1 md:hidden">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? 'location' : undefined}
              onClick={() => setActive(i.id)}
              className={cn(
                'block rounded-brand border px-3 py-1.5 text-sm transition-colors duration-200 ease-brand',
                active === i.id
                  ? 'border-ink-900 bg-ink-900 text-paper'
                  : 'border-line text-ink-700 hover:border-ink-900',
              )}
            >
              {i.title}
            </a>
          </li>
        ))}
        {extra ? (
          <li className="shrink-0">
            <Link
              href={extra.href as never}
              className="inline-flex items-center gap-1.5 rounded-brand border border-line px-3 py-1.5 text-sm text-ink-700 hover:border-ink-900"
            >
              {extra.label}
              <ArrowUpRight aria-hidden strokeWidth={1.5} className="size-3.5 rtl:-scale-x-100" />
            </Link>
          </li>
        ) : null}
      </ul>

      {/* Desktop: sticky rail */}
      <div className="hidden md:block">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div className="relative mt-4 border-s border-line">
          <span
            aria-hidden
            className="absolute -start-px top-0 w-0.5 bg-red-600 transition-[transform,height,opacity] duration-300 ease-brand motion-reduce:transition-none"
            style={indicator}
          />
          <ul ref={listRef} className="flex flex-col">
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  data-id={i.id}
                  aria-current={active === i.id ? 'location' : undefined}
                  onClick={() => setActive(i.id)}
                  className={cn(
                    'block py-2 ps-5 text-sm transition-colors duration-200 ease-brand',
                    active === i.id
                      ? 'font-semibold text-ink-900'
                      : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  {i.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {extra ? (
          <Link
            href={extra.href as never}
            className="group mt-6 inline-flex items-center gap-2 border-t border-line pt-4 text-sm font-medium text-ink-900"
          >
            <span className="link-grow relative">{extra.label}</span>
            <ArrowUpRight
              aria-hidden
              strokeWidth={1.5}
              className="size-4 text-red-700 transition-transform duration-200 ease-brand group-hover:-translate-y-0.5 motion-reduce:transition-none rtl:-scale-x-100"
            />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
