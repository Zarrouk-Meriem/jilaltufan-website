import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { parseAccent } from '@/lib/accent'
import { OrdinalLabel } from './OrdinalLabel'
import { RedRule } from './RedRule'

type Props = {
  title: string
  ordinal?: string
  intro?: ReactNode
  locale: string
  as?: 'h1' | 'h2' | 'h3'
  /** Centered only for hero and closing CTA; everything else aligns to the start edge. */
  align?: 'start' | 'center'
  onNavy?: boolean
  size?: 'lg' | 'md'
  className?: string
  id?: string
}

export function SectionHeading({
  title,
  ordinal,
  intro,
  locale,
  as: Tag = 'h2',
  align = 'start',
  onNavy,
  size = 'lg',
  className,
  id,
}: Props) {
  const segments = parseAccent(title)
  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center text-center' : 'items-start text-start',
        className,
      )}
    >
      {ordinal ? (
        <OrdinalLabel locale={locale} className={cn('mb-3', onNavy && 'text-on-navy-muted')}>
          {ordinal}
        </OrdinalLabel>
      ) : null}
      <Tag
        id={id}
        className={cn(
          'scroll-mt-28',
          size === 'lg' ? 'text-2xl' : 'text-xl',
          onNavy ? 'text-on-navy' : 'text-ink-900',
        )}
      >
        {segments.map((s, i) =>
          s.accent ? (
            <span
              key={i}
              className={
                onNavy
                  ? 'text-on-navy underline decoration-red-600 decoration-[3px] underline-offset-[0.18em]'
                  : 'text-red-600'
              }
            >
              {s.text}
            </span>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </Tag>
      <RedRule className="mt-5" tone={onNavy ? 'white' : 'red'} />
      {intro ? (
        <div className={cn('mt-6 measure text-md', onNavy ? 'text-on-navy-muted' : 'text-ink-700')}>
          {intro}
        </div>
      ) : null}
    </div>
  )
}
