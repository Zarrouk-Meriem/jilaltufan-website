import { Fragment, type ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { Callout } from '@/components/ui/Callout'

type Section = { h: string; body: string[] }

/** «**word**» → bold, the only markup the academy's legal texts use. */
function inline(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold text-ink-900">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

/** A section's lines: runs of «- item» become one list, every other line a paragraph. */
function blocks(lines: string[]) {
  const out: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (!list.length) return
    out.push(
      <ul key={`ul-${out.length}`} className="mt-4 flex list-disc flex-col gap-2 ps-6 text-ink-700">
        {list.map((l, i) => (
          <li key={i}>{inline(l)}</li>
        ))}
      </ul>,
    )
    list = []
  }
  for (const line of lines) {
    if (line.startsWith('- ')) {
      list.push(line.slice(2))
      continue
    }
    flush()
    out.push(
      <p key={`p-${out.length}`} className="mt-4 text-ink-700">
        {inline(line)}
      </p>,
    )
  }
  flush()
  return out
}

/**
 * The privacy policy and the terms: the academy's own text (2026-09-26), rendered as written
 * from the message files. A locale still waiting for its translation shows a note and a link to
 * the text that applies — legal text is never machine-translated.
 */
export function LegalText({
  updatedLabel,
  updated,
  intro,
  sections,
  pending,
  pendingLink,
}: {
  updatedLabel: string
  updated: string
  intro: string[]
  sections: Section[]
  pending?: string
  pendingLink?: { href: string; locale: 'ar'; label: string }
}) {
  if (!sections.length && pending)
    return (
      <Callout>
        <p>{pending}</p>
        {pendingLink ? (
          <p className="mt-3">
            <Link
              href={pendingLink.href as never}
              locale={pendingLink.locale}
              hrefLang="ar"
              className="underline decoration-red-600 underline-offset-2"
            >
              {pendingLink.label}
            </Link>
          </p>
        ) : null}
      </Callout>
    )
  return (
    <div className="measure">
      <p className="text-sm text-ink-500">
        {updatedLabel} <span className="tabular-nums">{updated}</span>
      </p>
      {intro.length ? <div className="mt-6">{blocks(intro)}</div> : null}
      <div className="mt-10 flex flex-col gap-12">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg">{s.h}</h2>
            {blocks(s.body)}
          </section>
        ))}
      </div>
    </div>
  )
}
