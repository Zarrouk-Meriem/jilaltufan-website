import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import { statusTokenExpired } from '@/lib/applications/status-token'
import type { Application } from '@/payload-types'
import { getClient } from './client'

/**
 * What the follow-up page is allowed to know. Deliberately small: the applicant's own
 * name, where the application stands, and when it was sent. Not the CV, not the internal
 * notes, not the token it was found by — the page renders this object and nothing else,
 * so a field added to the collection later cannot leak by being in scope.
 */
export type ApplicationStatusView = {
  fullName: string
  status: NonNullable<Application['applicationStatus']>
  submittedAt: string
  /** True when the link has aged out: the page then offers to send a fresh one. */
  expired: boolean
}

/**
 * The application behind a follow-up token, or null when the token is unknown.
 *
 * `overrideAccess` is on because reading an application is staff-only and the visitor is
 * nobody — the token is the authorisation, which is why it is looked up rather than
 * compared: an unknown token finds no row and the page 404s, the same answer a made-up
 * one gets.
 *
 * An expired token still finds its row. That is on purpose: holding the old link is proof
 * the letter reached them, so the page can send a new one to the address already on the
 * record — never to an address a visitor supplies.
 */
export const getApplicationByStatusToken = cache(
  async (token: string, locale: Locale): Promise<ApplicationStatusView | null> => {
    if (!token) return null
    const payload = await getClient()
    const res = await payload.find({
      collection: 'applications',
      where: { statusToken: { equals: token } },
      limit: 1,
      depth: 0,
      locale,
      fallbackLocale: 'ar',
      overrideAccess: true,
      select: {
        fullName: true,
        applicationStatus: true,
        statusTokenExpiresAt: true,
        createdAt: true,
      },
    })
    const doc = res.docs[0]
    if (!doc) return null
    return {
      fullName: doc.fullName,
      status: doc.applicationStatus ?? 'new',
      submittedAt: doc.createdAt,
      expired: statusTokenExpired(doc.statusTokenExpiresAt),
    }
  },
)
