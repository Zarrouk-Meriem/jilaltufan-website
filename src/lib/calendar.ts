/** Calendar exports for a session: an RFC 5545 .ics body and a Google Calendar URL. */

export type CalendarEvent = {
  uid: string
  title: string
  description?: string
  location?: string
  url?: string
  start: Date
  end: Date
}

const pad = (n: number) => String(n).padStart(2, '0')
/** UTC timestamp in iCalendar basic format: 20260915T130000Z */
export const icsDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Fold lines at 75 octets per RFC 5545 §3.1. */
function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8')
  if (bytes.length <= 75) return line
  const out: string[] = []
  let i = 0
  while (i < bytes.length) {
    let end = Math.min(i + (out.length ? 74 : 75), bytes.length)
    // don't split a multi-byte sequence
    while (end < bytes.length && end > i && (bytes[end]! & 0xc0) === 0x80) end--
    out.push((out.length ? ' ' : '') + bytes.subarray(i, end).toString('utf8'))
    i = end
  }
  return out.join('\r\n')
}

export function buildIcs(
  e: CalendarEvent,
  prodId = '-//Jeel Al-Toufan Academy//jilaltufan.com//AR',
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(e.start)}`,
    `DTEND:${icsDate(e.end)}`,
    `SUMMARY:${escapeText(e.title)}`,
    e.description ? `DESCRIPTION:${escapeText(e.description)}` : null,
    e.location ? `LOCATION:${escapeText(e.location)}` : null,
    e.url ? `URL:${e.url}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => !!l)
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsDate(e.start)}/${icsDate(e.end)}`,
  })
  if (e.description) p.set('details', e.description)
  if (e.location) p.set('location', e.location)
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
