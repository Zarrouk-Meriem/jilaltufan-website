'use client'

import React, { useState } from 'react'

export type RosterRow = {
  accountId: number
  name: string
  state: 'present' | 'absent' | 'excused' | null
  source: 'staff' | 'zoom' | null
  rowId: number | null
}

export type RosterStrings = {
  present: string
  absent: string
  excused: string
  save: string
  saving: string
  saved: string
  failed: string
  fromZoom: string
  unmarked: string
  /** A template, not a formatter: a function cannot cross from a server component. */
  count: string
}

const STATES = ['present', 'absent', 'excused'] as const

/**
 * The roster staff actually mark: one line per student, three choices, one save.
 *
 * It writes through the REST API from inside the admin, so Payload's own cookie
 * authenticates it (same origin, which is why the dev origin is on the CSRF list) and the
 * collection's `create`/`update` rules still apply — this is a convenience over the API,
 * not a way around it. Saving marks every row as `staff`, which is what makes it stick
 * against a later sync from Zoom.
 */
export function SessionAttendanceRoster({
  sessionId,
  rows: initial,
  t,
}: {
  sessionId: number
  rows: RosterRow[]
  t: RosterStrings
}) {
  const [rows, setRows] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  const set = (accountId: number, state: RosterRow['state']) => {
    setStatus('idle')
    setRows((r) => r.map((row) => (row.accountId === accountId ? { ...row, state } : row)))
  }

  const markAll = (state: RosterRow['state']) => {
    setStatus('idle')
    setRows((r) => r.map((row) => ({ ...row, state })))
  }

  const save = async () => {
    setStatus('saving')
    try {
      // A new array rather than edits in place: these rows are state, and the id a created
      // row comes back with belongs in the next render, not in the current one.
      const next: RosterRow[] = []
      for (const row of rows) {
        if (!row.state) {
          next.push(row)
          continue
        }
        const body = JSON.stringify({
          session: sessionId,
          account: row.accountId,
          state: row.state,
          source: 'staff',
        })
        const res = await fetch(row.rowId ? `/api/attendance/${row.rowId}` : '/api/attendance', {
          method: row.rowId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body,
        })
        if (!res.ok) throw new Error(await res.text())
        const rowId = row.rowId ?? ((await res.json()) as { doc: { id: number } }).doc.id
        next.push({ ...row, rowId, source: 'staff' })
      }
      setRows(next)
      setStatus('saved')
    } catch {
      setStatus('failed')
    }
  }

  const present = rows.filter((r) => r.state === 'present').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn--style-secondary btn--size-small"
            onClick={() => markAll(s)}
          >
            {t[s]}
          </button>
        ))}
        <span style={{ opacity: 0.7 }}>
          {t.count.replace('{marked}', String(present)).replace('{total}', String(rows.length))}
        </span>
      </div>

      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {rows.map((row) => (
          <li
            key={row.accountId}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.4rem 0',
              borderBottom: '1px solid var(--theme-elevation-100)',
            }}
          >
            <span style={{ flex: '1 1 12rem', minWidth: 0 }}>{row.name}</span>
            <span style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {STATES.map((s) => (
                <label
                  key={s}
                  style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
                >
                  <input
                    type="radio"
                    name={`attendance-${row.accountId}`}
                    value={s}
                    checked={row.state === s}
                    onChange={() => set(row.accountId, s)}
                  />
                  {t[s]}
                </label>
              ))}
            </span>
            <span style={{ opacity: 0.6, fontSize: '0.8em', minWidth: '5rem' }}>
              {row.state === null ? t.unmarked : row.source === 'zoom' ? t.fromZoom : ''}
            </span>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn--style-primary btn--size-small"
          onClick={save}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? t.saving : t.save}
        </button>
        {status === 'saved' ? <span role="status">{t.saved}</span> : null}
        {status === 'failed' ? <span role="alert">{t.failed}</span> : null}
      </div>
    </div>
  )
}
