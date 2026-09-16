'use client'

import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { cn } from '@/lib/cn'

export type AccordionItem = {
  id: string
  heading: React.ReactNode
  meta?: React.ReactNode
  content: React.ReactNode
}

/**
 * Keyboard-complete disclosure list. Each item is a heading + button (aria-expanded,
 * aria-controls) and a region. Items are deep-linkable: `#session-3` opens item
 * `session-3` on mount. Arrow keys move between headers; Home/End jump.
 */
export function Accordion({
  items,
  className,
  headingLevel = 3,
  defaultOpen,
}: {
  items: AccordionItem[]
  className?: string
  headingLevel?: 2 | 3 | 4
  defaultOpen?: string[]
}) {
  const uid = useId()
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ?? []))

  // Sync with the URL hash (an external system): on mount and on hashchange.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash && items.some((i) => i.id === hash)) {
        setOpen((s) => (s.has(hash) ? s : new Set(s).add(hash)))
        requestAnimationFrame(() =>
          document.getElementById(hash)?.scrollIntoView({ block: 'start' }),
        )
      }
    }
    const raf = requestAnimationFrame(sync)
    window.addEventListener('hashchange', sync)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('hashchange', sync)
    }
  }, [items])

  const toggle = useCallback((id: string) => {
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = Array.from(
      (
        e.currentTarget.closest('[data-accordion]') as HTMLElement
      ).querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]'),
    )
    const go = (i: number) => buttons[(i + buttons.length) % buttons.length]?.focus()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      go(index + 1)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      go(index - 1)
    }
    if (e.key === 'Home') {
      e.preventDefault()
      go(0)
    }
    if (e.key === 'End') {
      e.preventDefault()
      go(buttons.length - 1)
    }
  }

  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4'

  return (
    <div data-accordion className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item, i) => {
        const expanded = open.has(item.id)
        const btnId = `${uid}-${item.id}-btn`
        const panelId = `${uid}-${item.id}-panel`
        return (
          <div key={item.id} id={item.id} className="scroll-mt-28">
            <H className="m-0">
              <button
                type="button"
                id={btnId}
                data-accordion-trigger
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="group flex w-full items-start justify-between gap-4 py-5 text-start transition-colors duration-150 hover:bg-paper-2 focus-visible:bg-paper-2"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-md font-semibold text-ink-900">{item.heading}</span>
                  {item.meta ? <span className="text-sm text-ink-500">{item.meta}</span> : null}
                </span>
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.5}
                  className={cn(
                    'mt-1 size-5 shrink-0 text-ink-500 transition-transform duration-200 ease-brand motion-reduce:transition-none',
                    expanded && 'rotate-180',
                  )}
                />
              </button>
            </H>
            {/* Height animates through grid-template-rows; closed panels are inert for
                keyboard and assistive tech. Reduced motion snaps. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              aria-hidden={!expanded}
              inert={!expanded}
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-brand motion-reduce:transition-none',
                expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pb-6 text-ink-700">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
