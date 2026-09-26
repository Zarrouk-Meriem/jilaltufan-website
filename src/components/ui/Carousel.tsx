'use client'
import { Children, useCallback, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

/**
 * A row of cards that scrolls sideways: the browser's own scrolling, snapped to each card
 * (swipe, trackpad and keyboard all work), with previous/next buttons that move one card at a
 * time. Built on logical directions: in Arabic «next» scrolls leftwards and the arrows mirror.
 * Reduced motion jumps instead of gliding.
 */
export function Carousel({
  label,
  previousLabel,
  nextLabel,
  children,
  className,
}: {
  /** What the row holds, for screen readers: «برامج التدريب الموجّه». */
  label: string
  previousLabel: string
  nextLabel: string
  children: ReactNode
  className?: string
}) {
  const track = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  // In RTL scrollLeft runs from 0 down to negative values; its magnitude is the distance.
  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const at = Math.abs(el.scrollLeft)
    const start = at < 4
    const end = at + el.clientWidth >= el.scrollWidth - 4
    setEdge((e) => (e.start === start && e.end === end ? e : { start, end }))
  }, [])
  // Stable, so React attaches it once (an inline callback re-ran on every render and looped).
  const attach = useCallback(
    (el: HTMLUListElement | null) => {
      track.current = el
      if (el) measure()
    },
    [measure],
  )

  const step = (dir: 1 | -1) => {
    const el = track.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    const rtl = getComputedStyle(el).direction === 'rtl'
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({
      left: (card.getBoundingClientRect().width + gap) * dir * (rtl ? -1 : 1),
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  const button = (dir: 1 | -1, text: string, disabled: boolean) => (
    <button
      type="button"
      onClick={() => step(dir)}
      disabled={disabled}
      aria-label={text}
      className="grid size-10 place-items-center rounded-brand border border-line-strong bg-paper text-ink-900 transition-[opacity,border-color] duration-200 ease-out hover:border-ink-700 disabled:cursor-default disabled:opacity-35 disabled:hover:border-line-strong motion-reduce:transition-none"
    >
      <Icon
        name="arrow"
        tone="mono"
        direction={dir === 1 ? 'forward' : 'back'}
        className="size-4"
      />
    </button>
  )

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      // min-w-0: inside a grid or flex parent the scrolling row must not widen the page.
      className={cn('flex min-w-0 flex-col gap-4', className)}
    >
      <ul
        ref={attach}
        onScroll={measure}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto overscroll-x-contain pb-1 [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <li className="flex w-[85%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] [&>*]:w-full">
            {child}
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        {button(-1, previousLabel, edge.start)}
        {button(1, nextLabel, edge.end)}
      </div>
    </div>
  )
}
