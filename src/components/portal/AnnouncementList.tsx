import { Prose } from '@/components/content/Prose'
import { Badge } from '@/components/ui/Badge'
import { TextLink } from '@/components/ui/TextLink'
import type { Locale } from '@/i18n/routing'
import type { AccountAnnouncement } from '@/lib/queries/account'
import { formatInZone } from '@/lib/time'

/**
 * A program's announcements, newest first. `full` shows the text (the program page);
 * otherwise each one is a line with a way to the program page (the overview). One for
 * every student carries a small «لكل الطلبة» so it is not mistaken for this program's own.
 */
export function AnnouncementList({
  items,
  locale,
  academyZone,
  labels,
  full = false,
  fallbackSlug,
}: {
  items: AccountAnnouncement[]
  locale: Locale
  academyZone: string
  labels: { forAll: string; read: string }
  full?: boolean
  /** Where a compact line for everyone links to (the student's first program). */
  fallbackSlug?: string
}) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map((a) => {
        const slug = a.program?.slug ?? fallbackSlug
        return (
          <li key={a.id} className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
              <time dateTime={a.publishedAt}>
                {formatInZone(a.publishedAt, locale, academyZone).date}
              </time>
              {a.program ? (
                full ? null : (
                  <span>{a.program.title}</span>
                )
              ) : (
                <Badge tone="muted">{labels.forAll}</Badge>
              )}
            </div>
            <h3 className="text-md font-semibold text-ink-900">{a.title}</h3>
            {full ? (
              <Prose data={a.body} className="text-ink-700" />
            ) : slug ? (
              <TextLink href={`/account/programs/${slug}`} className="self-start text-sm">
                {labels.read}
              </TextLink>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
