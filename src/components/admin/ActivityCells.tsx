import type { DefaultServerCellComponentProps, Field, JSONFieldServerProps } from 'payload'
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
export async function TimeCell({
  cellData,
  i18n,
  payload,
  link,
  linkURL,
  rowData,
}: DefaultServerCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return <span>—</span>
  const zone = await academyZone(payload)
  const parts = formatInZone(cellData, i18n.language === 'ar' ? 'ar' : 'en', zone)
  const text = (
    <time dateTime={cellData}>
      {parts.date}
      {i18n.language === 'ar' ? '، ' : ', '}
      {parts.time}
    </time>
  )
  // As the first column, this cell carries the row's link to its own page (Payload's default
  // cell does the same); a custom cell has to draw it itself.
  const href =
    linkURL ?? (link ? `${payload.config.routes.admin}/collections/activity/${rowData.id}` : null)
  return href ? <a href={href}>{text}</a> : text
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

type FieldMap = ReturnType<typeof namedFields>

/** The target's top-level fields, to turn stored raw values into labels. */
function targetFields(payload: Payload, target: string): FieldMap {
  const collections = payload.collections as Record<
    string,
    { config: { fields: Field[] } } | undefined
  >
  const config =
    collections[target]?.config ?? payload.config.globals.find((g) => g.slug === target)
  return namedFields(config?.fields ?? [])
}

/** The changes column: only which fields changed. The values are on the row's own page. */
export function ChangesCell({ cellData, i18n }: DefaultServerCellComponentProps) {
  const changes = Array.isArray(cellData) ? (cellData as Change[]) : []
  if (changes.length === 0) return <span>—</span>
  const ar = i18n.language === 'ar'
  return (
    <span>
      {changes.map((c) => (ar ? c.label?.ar : c.label?.en) ?? c.field).join(ar ? '، ' : ', ')}
    </span>
  )
}

/**
 * The changes on the row's page, as a table: the field, what it was, what it became. Each
 * value sits in its own cell with its own direction, so Arabic and English never share a
 * line. A field that was changed but whose value is not stored (rich text, a long list, a
 * read-restricted field) shows only that it changed.
 */
export function ChangesField({ data, i18n, payload }: JSONFieldServerProps) {
  const changes = Array.isArray(data?.changes) ? (data.changes as Change[]) : []
  const ar = i18n.language === 'ar'
  const lang = ar ? 'ar' : 'en'
  const t = ar
    ? {
        title: 'التغييرات',
        field: 'الحقل',
        from: 'قبل',
        to: 'بعد',
        none: 'لا تغييرات مسجّلة.',
        changed: 'تغيّر',
      }
    : {
        title: 'Changes',
        field: 'Field',
        from: 'Before',
        to: 'After',
        none: 'No changes recorded.',
        changed: 'Changed',
      }
  const fields = targetFields(payload, String(data?.target ?? ''))
  return (
    <div className="jaa-changes field-type">
      <div className="jaa-changes__label">{t.title}</div>
      {changes.length === 0 ? (
        <p className="jaa-changes__empty">{t.none}</p>
      ) : (
        <table className="jaa-changes__table">
          <thead>
            <tr>
              <th>{t.field}</th>
              <th>{t.from}</th>
              <th>{t.to}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => {
              const field = fields.get(c.field)
              const withValues = 'from' in c || 'to' in c
              return (
                <tr key={c.field}>
                  <th scope="row">{(ar ? c.label?.ar : c.label?.en) ?? c.field}</th>
                  {withValues ? (
                    <>
                      <td dir="auto">{quote(optionLabel(field, c.from, lang))}</td>
                      <td dir="auto">{quote(optionLabel(field, c.to, lang))}</td>
                    </>
                  ) : (
                    <td colSpan={2} className="jaa-changes__muted">
                      {t.changed}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
