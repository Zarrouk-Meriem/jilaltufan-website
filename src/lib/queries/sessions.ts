import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Session } from '@/payload-types'
import { canShowJoinLink, type JoinGate } from '@/lib/time/join'
import type { Where } from 'payload'
import { getClient, publicBase } from './client'
import { getSiteSettings } from './globals'

/**
 * A session as the public site sees it. `joinUrl` is present ONLY when the
 * join policy allows it right now — decided here, in one place, so the URL is
 * absent from the payload (and therefore the HTML) otherwise. The passcode and
 * meeting id never leave the server.
 */
export type PublicSession = Omit<Session, 'zoomJoinUrl' | 'zoomPasscode' | 'zoomMeetingId'> & {
  joinUrl: string | null
}

export function toPublic(s: Session, gate: JoinGate): PublicSession {
  const { zoomJoinUrl, zoomPasscode: _pass, zoomMeetingId: _id, ...rest } = s
  const allowed =
    !!zoomJoinUrl &&
    canShowJoinLink(
      { startsAt: s.startsAt, durationMinutes: s.durationMinutes, sessionStatus: s.sessionStatus },
      gate,
    )
  return { ...rest, joinUrl: allowed ? zoomJoinUrl! : null }
}

const gateFor = cache(async (locale: Locale, now: Date): Promise<JoinGate> => {
  const s = await getSiteSettings(locale)
  return { policy: s.joinLinkVisibility, windowMinutes: s.joinWindowMinutes, now }
})

const base = (locale: Locale) => ({
  collection: 'sessions' as const,
  ...publicBase(locale),
  sort: 'startsAt',
})

export const listSessionsForProgram = cache(
  async (locale: Locale, programId: number, now = new Date()): Promise<PublicSession[]> => {
    const [payload, gate] = await Promise.all([getClient(), gateFor(locale, now)])
    const res = await payload.find({
      ...base(locale),
      where: { and: [{ program: { equals: programId } }, { status: { equals: 'published' } }] },
      limit: 24,
    })
    return res.docs.map((d) => toPublic(d, gate))
  },
)

export const listUpcomingSessions = cache(
  async (locale: Locale, limit = 3, from: Date = new Date()): Promise<PublicSession[]> => {
    const [payload, gate] = await Promise.all([getClient(), gateFor(locale, from)])
    const res = await payload.find({
      ...base(locale),
      where: {
        and: [
          { status: { equals: 'published' } },
          { sessionStatus: { not_equals: 'cancelled' } },
          { startsAt: { greater_than_equal: from.toISOString() } },
        ],
      },
      limit,
    })
    return res.docs.map((d) => toPublic(d, gate))
  },
)

export const listSessionsInRange = cache(
  async (
    locale: Locale,
    fromISO: string,
    toISO: string,
    now = new Date(),
  ): Promise<PublicSession[]> => {
    const [payload, gate] = await Promise.all([getClient(), gateFor(locale, now)])
    const res = await payload.find({
      ...base(locale),
      where: {
        and: [
          { status: { equals: 'published' } },
          { startsAt: { greater_than_equal: fromISO } },
          { startsAt: { less_than: toISO } },
        ],
      },
      limit: 200,
    })
    return res.docs.map((d) => toPublic(d, gate))
  },
)

/** Every published session, optionally for one program slug — the schedule page. */
export const listSchedule = cache(
  async (locale: Locale, programSlug?: string, now = new Date()): Promise<PublicSession[]> => {
    const [payload, gate] = await Promise.all([getClient(), gateFor(locale, now)])
    const where: Where[] = [{ status: { equals: 'published' } }]
    if (programSlug) where.push({ 'program.slug': { equals: programSlug } })
    const res = await payload.find({ ...base(locale), where: { and: where }, limit: 500 })
    return res.docs.map((d) => toPublic(d, gate))
  },
)

export const getSessionById = cache(
  async (locale: Locale, id: number, now = new Date()): Promise<PublicSession | null> => {
    const [payload, gate] = await Promise.all([getClient(), gateFor(locale, now)])
    const res = await payload.find({
      ...base(locale),
      where: { and: [{ id: { equals: id } }, { status: { equals: 'published' } }] },
      limit: 1,
    })
    return res.docs[0] ? toPublic(res.docs[0], gate) : null
  },
)
