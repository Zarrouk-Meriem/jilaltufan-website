import { ExternalLink, FileText, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export function MaterialRow({
  title,
  type,
  typeLabel,
  href,
  description,
  programTitle,
  actionLabel,
}: {
  title: string
  type: 'pdf' | 'link' | 'reading'
  typeLabel: string
  href?: string | null
  description?: string | null
  programTitle?: string | null
  actionLabel: string
}) {
  const Icon = type === 'pdf' ? FileText : type === 'link' ? ExternalLink : BookOpen
  return (
    <div className="flex items-start gap-4 py-5">
      <Icon aria-hidden strokeWidth={1.5} className="mt-1 size-5 shrink-0 text-ink-500" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-md font-semibold text-ink-900">{title}</h3>
          <Badge tone="muted">{typeLabel}</Badge>
        </div>
        {programTitle ? <p className="mt-1 text-xs text-ink-500">{programTitle}</p> : null}
        {description ? <p className="mt-2 measure text-sm text-ink-700">{description}</p> : null}
        {href ? (
          <a
            href={href}
            target={type === 'link' ? '_blank' : undefined}
            rel={type === 'link' ? 'noopener noreferrer' : undefined}
            download={type === 'pdf' ? true : undefined}
            className="link-grow relative mt-3 inline-flex min-h-6 items-center text-sm font-medium text-ink-900"
          >
            {actionLabel}
          </a>
        ) : null}
      </div>
    </div>
  )
}
