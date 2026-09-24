import type { ReactNode } from 'react'
import { parseAccent } from '@/lib/accent'
import { cn } from '@/lib/cn'

/**
 * The portal's small vocabulary: a page opening, a card, a labelled fact, a progress bar.
 *
 * Kept apart from the public site's sections because the two are read differently — a
 * visitor is being persuaded, a student is checking something — so this is quieter: no
 * ordinals, no accent rules, no texture. Brand tokens throughout, 2 px radius, and the mark
 * appears nowhere as an indicator.
 */
export function PageOpening({
  title,
  intro,
  aside,
}: {
  title: string
  intro?: string
  aside?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-x-8 gap-y-3 md:mb-10">
      <div className="min-w-0">
        {/* The brand's own accent: the `**word**` in a title is the red one. */}
        <h1 className="text-2xl font-semibold text-balance text-ink-900 md:text-3xl">
          {parseAccent(title).map((seg, i) => (
            <span key={i} className={seg.accent ? 'text-red-600' : undefined}>
              {seg.text}
            </span>
          ))}
        </h1>
        {intro ? <p className="mt-2 measure text-base text-ink-700">{intro}</p> : null}
      </div>
      {aside}
    </header>
  )
}

export function Card({
  title,
  action,
  children,
  className,
  tone = 'paper',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'paper' | 'navy'
}) {
  return (
    <section
      className={cn(
        'rounded-brand p-6 md:p-7',
        tone === 'paper' ? 'border border-line bg-paper' : 'bg-navy-900 text-on-navy',
        className,
      )}
    >
      {title || action ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h2
              className={cn(
                'text-xs font-semibold',
                tone === 'paper' ? 'text-ink-500' : 'text-on-navy/70',
              )}
            >
              {title}
            </h2>
          ) : null}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** One labelled fact. `ltr` for anything the reader scans left to right whatever the page does. */
export function Fact({ label, value, ltr }: { label: string; value: ReactNode; ltr?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd
        dir={ltr ? 'ltr' : undefined}
        className="mt-1 text-start text-md font-medium break-words text-ink-900"
      >
        {value}
      </dd>
    </div>
  )
}

export function Facts({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>
}

/**
 * Attendance, as a bar and a sentence. The bar is decoration — the sentence carries the
 * meaning, so a screen reader is told once and not twice.
 */
export function Progress({
  attended,
  total,
  label,
  note,
}: {
  attended: number
  total: number
  label: string
  note?: string
}) {
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0
  return (
    <div>
      <p className="text-md font-medium text-ink-900">{label}</p>
      {note ? <p className="mt-1 text-sm text-ink-500">{note}</p> : null}
      <div aria-hidden className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full rounded-full bg-red-600 transition-[width] duration-300 ease-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** A quiet row of links to the rest of the portal, for the overview. */
export function QuickLinks({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}
