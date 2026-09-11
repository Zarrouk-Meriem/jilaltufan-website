import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/lib/cn'

/** Inner-page opening: breadcrumbs, ordinal, title with red rule, one intro paragraph. Paper, not navy. */
export function PageIntro({
  locale,
  title,
  intro,
  ordinal,
  crumbs,
  crumbLabel,
  children,
  className,
}: {
  locale: string
  title: string
  intro?: string | null
  ordinal?: string
  crumbs?: Crumb[]
  crumbLabel?: string
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
      </div>
    </header>
  )
}
