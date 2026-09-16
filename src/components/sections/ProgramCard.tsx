import { ArrowUpLeft } from 'lucide-react'
import { Mark } from '@/components/brand/Mark'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { DuotoneImage } from '@/components/ui/DuotoneImage'
import type { ImageSource } from '@/lib/media'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

type Props = {
  href: string
  title: string
  description?: string | null
  ordinal?: string
  trackLabel: string
  registration: { label: string; tone: BadgeTone }
  sessionsLabel?: string | null
  seasonLabel?: string | null
  motif?: 'none' | 'keffiyeh' | 'mark' | null
  /** Cover image, navy-duotoned; the card stays typographic without one. */
  image?: ImageSource | null
  /** Wide, editorial feature card for the open track. */
  featured?: boolean
  featuredCta?: string
  className?: string
}

/**
 * A program as a quiet, editorial card: ordinal, title, one-line description,
 * three facts, registration badge. The whole card is the link; the arrow and
 * the underline answer hover. A cover image, when the academy supplies one, sits
 * on top as a navy duotone so the card stays on-brand whatever the photo.
 */
export function ProgramCard({
  href,
  title,
  description,
  ordinal,
  trackLabel,
  registration,
  sessionsLabel,
  seasonLabel,
  motif,
  image,
  featured,
  featuredCta,
  className,
}: Props) {
  return (
    <Link
      href={href as never}
      className={cn(
        'group relative flex flex-col rounded-brand border border-line bg-paper transition-[border-color,box-shadow] duration-200 ease-brand',
        'hover:border-ink-900 focus-visible:border-ink-900',
        featured
          ? 'border-transparent pattern-keffiyeh-navy p-8 surface-navy md:p-12'
          : 'p-7 md:p-8',
        motif === 'keffiyeh' && !featured && 'pattern-keffiyeh-paper',
        className,
      )}
    >
      {image ? (
        <DuotoneImage
          {...image}
          sizes={featured ? '(min-width: 1280px) 1200px, 100vw' : '(min-width: 768px) 33vw, 100vw'}
          // No width utility: as a block with negative horizontal margins it stretches
          // across the card's padding on its own (`w-full` would pin it to the content box).
          className={cn(
            'mb-7 aspect-[3/2] rounded-brand rounded-b-none',
            featured
              ? '-mx-8 -mt-8 md:-mx-12 md:-mt-12 md:aspect-[21/9]'
              : '-mx-7 -mt-7 md:-mx-8 md:-mt-8',
          )}
        />
      ) : null}
      {motif === 'mark' && !featured ? (
        <span
          aria-hidden
          className="absolute start-0 top-0 overflow-hidden"
          style={{ width: 44, height: 44 }}
        >
          <span className="absolute -start-3 -top-3 block">
            <Mark size={34} />
          </span>
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <span
          className={cn('text-xs font-medium', featured ? 'text-on-navy-muted' : 'text-ink-500')}
        >
          {ordinal ? `${ordinal} · ` : ''}
          {trackLabel}
        </span>
        <Badge
          tone={featured ? 'neutral' : registration.tone}
          className={cn(featured && 'border-on-navy-line text-on-navy')}
        >
          {registration.label}
        </Badge>
      </div>

      <h3
        className={cn(
          'mt-6 text-balance',
          featured ? 'text-3xl text-on-navy' : 'text-lg text-ink-900',
        )}
      >
        {title}
      </h3>
      {description ? (
        <p className={cn('mt-3 measure', featured ? 'text-md text-on-navy-muted' : 'text-ink-700')}>
          {description}
        </p>
      ) : null}

      <div
        className={cn(
          'mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-8 text-sm',
          featured ? 'text-on-navy-muted' : 'text-ink-500',
        )}
      >
        {sessionsLabel ? <span>{sessionsLabel}</span> : null}
        {sessionsLabel && seasonLabel ? (
          <span aria-hidden className={cn('h-3 w-px', featured ? 'bg-on-navy-line' : 'bg-line')} />
        ) : null}
        {seasonLabel ? <span>{seasonLabel}</span> : null}
        <span
          className={cn(
            'ms-auto inline-flex items-center gap-1.5 font-medium',
            featured ? 'text-on-navy' : 'text-ink-900',
          )}
        >
          {featured && featuredCta ? (
            <span className="link-grow relative">{featuredCta}</span>
          ) : null}
          <ArrowUpLeft
            aria-hidden
            strokeWidth={1.5}
            className="size-4 transition-transform duration-200 ease-brand group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none ltr:rotate-90"
          />
        </span>
      </div>
    </Link>
  )
}
