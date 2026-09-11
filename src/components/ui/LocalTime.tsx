'use client'

import { useSyncExternalStore } from 'react'
import { formatInZone } from '@/lib/time'

const subscribe = () => () => {}
const getZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const getServerZone = () => null

/**
 * The visitor's local time for a session. The zone is read as an external store
 * (null during SSR, so no hydration mismatch) and the text derives in render.
 * Renders nothing when the visitor is already in the academy zone.
 */
export function LocalTime({
  iso,
  locale,
  academyZone,
  label,
  className,
}: {
  iso: string
  locale: string
  academyZone: string
  label: string
  className?: string
}) {
  const zone = useSyncExternalStore(subscribe, getZone, getServerZone)
  if (!zone || zone === academyZone) return null
  const p = formatInZone(iso, locale, zone)
  const sameDay = p.day === formatInZone(iso, locale, academyZone).day
  const text = sameDay ? p.time : `${p.time} · ${p.day} ${p.monthShort}`
  return (
    <span className={className}>
      <span className="tabular-nums">{text}</span> <span className="text-ink-500">{label}</span>
    </span>
  )
}
