import type { DefaultServerCellComponentProps, Field } from 'payload'
import React, { cache } from 'react'
import { namedFields, optionLabel, type Change } from '@/lib/payload/activity'
import { DEFAULT_TZ, formatInZone } from '@/lib/time'

type Payload = DefaultServerCellComponentProps['payload']

/** The academy's zone, read once per render of the list rather than once per row. */
const academyZone = cache(async (payload: Payload): Promise<string> => {
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  return settings.academyTimeZone || DEFAULT_TZ
})

/**
 * The time column, in the academy's zone and the admin's language, rendered on the server:
 * Payload's own date cell formats in the browser's zone once its locale chunk loads, and its
 * numeric pattern reads back to front under RTL.
 */
export async function TimeCell({ cellData, i18n, payload }: DefaultServerCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return <span>—</span>
  const zone = await academyZone(payload)
  const parts = formatInZone(cellData, i18n.language === 'ar' ? 'ar' : 'en', zone)
  return (
    <time dateTime={cellData}>
      {parts.date}
      {i18n.language === 'ar' ? '، ' : ', '}
      {parts.time}
    </time>
  )
}

/** Slugs that are globals in this config: they live at /admin/globals/<slug>, with no id. */
const isGlobal = (payload: DefaultServerCellComponentProps['payload'], slug: string) =>
  payload.config.globals.some((g) => g.slug === slug)

/**
 * The document column: the title, linked to the record while it still exists (a deleted
 * document has nowhere to go). Globals link to their single edit page.
 */
export function DocumentCell({ cellData, rowData, payload }: DefaultServerCellComponentProps) {
  const title = typeof cellData === 'string' && cellData ? cellData : '—'
  const admin = payload.config.routes.admin
  const target = String(rowData.target ?? '')
  const href =
    rowData.action === 'delete'
      ? null
      : isGlobal(payload, target)
        ? `${admin}/globals/${target}`
        : rowData.docId
          ? `${admin}/collections/${target}/${rowData.docId}`
          : null
  return href ? <a href={href}>{title}</a> : <span>{title}</span>
}

const quote = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? '✓' : '✗'
  if (Array.isArray(v)) return v.map(quote).join('، ')
  return String(v)
}

/**
 * The changes column, as words rather than JSON: the field's label, and when both sides
 * are short, the old and the new value.
 */
export function ChangesCell({ cellData, rowData, i18n, payload }: DefaultServerCellComponentProps) {
  const changes = Array.isArray(cellData) ? (cellData as Change[]) : []
  if (changes.length === 0) return <span>—</span>
  const ar = i18n.language === 'ar'
  const lang = ar ? 'ar' : 'en'
  const target = String(rowData.target ?? '')
  const collections = payload.collections as Record<
    string,
    { config: { fields: Field[] } } | undefined
  >
  const config =
    collections[target]?.config ?? payload.config.globals.find((g) => g.slug === target)
  const fields = namedFields(config?.fields ?? [])
  return (
    <span>
      {changes.map((c, i) => {
        const label = ar ? c.label?.ar : c.label?.en
        const withValues = 'from' in c || 'to' in c
        const field = fields.get(c.field)
        const from = quote(optionLabel(field, c.from, lang))
        const to = quote(optionLabel(field, c.to, lang))
        const text = withValues
          ? ar
            ? `${label}: من «${from}» إلى «${to}»`
            : `${label}: “${from}” to “${to}”`
          : label
        return (
          <React.Fragment key={c.field}>
            {i > 0 && (ar ? '؛ ' : '; ')}
            {text}
          </React.Fragment>
        )
      })}
    </span>
  )
}
