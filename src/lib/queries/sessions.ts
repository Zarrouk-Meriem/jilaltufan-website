import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Session } from '@/payload-types'
import { getClient, publicBase } from './client'

/**
 * A session as the public site sees it. `zoomJoinUrl` is present only when the
 * join policy allows it — decided here, in one place, never in JSX. Until the
 * window logic lands (M4) the URL is always stripped.
 */
export type PublicSession = Omit<Session, 'zoomJoinUrl' | 'zoomPasscode' | 'zoomMeetingId'> & {
  joinUrl: string | null
}

function toPublic(s: Session): PublicSession {
  const { zoomJoinUrl: _url, zoomPasscode: _pass, zoomMeetingId: _id, ...rest } = s
  return { ...rest, joinUrl: null }
}

const base = (locale: Locale) => ({
  collection: 'sessions' as const,
  ...publicBase(locale),
  sort: 'startsAt',
})

export const listSessionsForProgram = cache(
  async (locale: Locale, programId: number): Promise<PublicSession[]> => {
    const payload = await getClient()
    const res = await payload.find({
      ...base(locale),
      where: { and: [{ program: { equals: programId } }, { status: { equals: 'published' } }] },
      limit: 24,
    })
    return res.docs.map(toPublic)
  },
)

export const listUpcomingSessions = cache(
  async (locale: Locale, limit = 3, from: Date = new Date()): Promise<PublicSession[]> => {
    const payload = await getClient()
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
    return res.docs.map(toPublic)
  },
)

export const listSessionsInRange = cache(
  async (locale: Locale, fromISO: string, toISO: string): Promise<PublicSession[]> => {
    const payload = await getClient()
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
    return res.docs.map(toPublic)
  },
)
