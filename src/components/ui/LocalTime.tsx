'use client'

import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import { formatInZone } from '@/lib/time'

const subscribe = () => () => {}
const getZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const getServerZone = () => null

/**
 * The visitor's local time for a session. The zone is read as an external store
 * (null during SSR, so no hydration mismatch) and the text derives in render.
 *
 * The slot is always rendered, one line tall, and the text fades into it: the zone
 * is only known after hydration, and a label that appears then would grow every
 * row and push the rest of the page down (CLS 0.30 on the home page before
 * 2026-09-20 — Motion rules: reserve the space). The slot stays empty when the
 * local time would read the same as the academy's, whatever the zone's name.
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
  let text: string | null = null
  if (zone && zone !== academyZone) {
    const local = formatInZone(iso, locale, zone)
    const academy = formatInZone(iso, locale, academyZone)
    const sameDay = local.day === academy.day
    if (!sameDay || local.time !== academy.time)
      text = sameDay ? local.time : `${local.time} · ${local.day} ${local.monthShort}`
  }
  return (
    <span className={cn('block min-h-5 basis-full', className)}>
      {text ? (
        <span className="enter-fade">
          <span className="tabular-nums">{text}</span> <span className="text-ink-500">{label}</span>
        </span>
      ) : null}
    </span>
  )
}
