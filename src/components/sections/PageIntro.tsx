import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs'
import { DuotoneImage } from '@/components/ui/DuotoneImage'
import type { ImageSource } from '@/lib/media'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/lib/cn'

/**
 * Inner-page opening: breadcrumbs, ordinal, title with red rule, one intro paragraph.
 * Paper, not navy. An optional cover sits under the type as a navy duotone (reference 07).
 */
export function PageIntro({
  locale,
  title,
  intro,
  ordinal,
  crumbs,
  crumbLabel,
  cover,
  children,
  className,
}: {
  locale: string
  title: string
  intro?: string | null
  ordinal?: string
  crumbs?: Crumb[]
  crumbLabel?: string
  cover?: ImageSource | null
  children?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('hairline-b', className)}>
      <div className="container-site pt-10 pb-14 md:pt-14 md:pb-20">
        {crumbs && crumbLabel ? (
          <Breadcrumbs items={crumbs} label={crumbLabel} className="mb-8" />
        ) : null}
        <SectionHeading
          as="h1"
          locale={locale}
          title={title}
          ordinal={ordinal}
          intro={intro ?? undefined}
          className="[&_h1]:text-3xl"
        />
        {children}
        {cover ? (
          <DuotoneImage
            {...cover}
            dim={0.08}
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="mt-10 aspect-[16/9] w-full rounded-brand md:mt-14 md:aspect-[21/9]"
          />
        ) : null}
      </div>
    </header>
  )
}
