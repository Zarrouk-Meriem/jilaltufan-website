import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Account, Application, Material, Program } from '@/payload-types'
import type { PublicSession } from './sessions'
import { getClient } from './client'
import { listMaterials } from './materials'
import { listSessionsForProgram } from './sessions'

/**
 * What a signed-in student may see of their own record. As with the follow-up page, this is
 * a small object rather than the document: a field added to `applications` later cannot
 * reach the window by being in scope, and the staff-only fields (internal notes, the token,
 * the email stamps) are never selected at all.
 */
export type AccountApplication = {
  id: number
  status: NonNullable<Application['applicationStatus']>
  submittedAt: string
  program: { id: number; title: string; slug: string } | null
  /** As they filled it in. Shown back to them, not editable here — see `account.detailsNote`. */
  details: { label: 'fullName' | 'email' | 'phone' | 'profession'; value: string }[]
  document: { name: string; url: string; size: number | null } | null
}

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? (v as { id: number }).id
      : null

/**
 * The application an account came from.
 *
 * `overrideAccess` because reading an application is staff-only and a student is not staff;
 * the authorisation is the account itself, and the query is pinned to the one application
 * the account points at — never to an id the page was given.
 */
export const getAccountApplication = cache(
  async (account: Account, locale: Locale): Promise<AccountApplication | null> => {
    const applicationId = idOf(account.application)
    if (!applicationId) return null

    const payload = await getClient()
    const doc = await payload
      .findByID({
        collection: 'applications',
        id: applicationId,
        locale,
        fallbackLocale: 'ar',
        depth: 1,
        overrideAccess: true,
      })
      .catch(() => null)
    if (!doc) return null

    const program = typeof doc.program === 'object' && doc.program ? (doc.program as Program) : null
    const cv = typeof doc.cv === 'object' && doc.cv ? doc.cv : null

    return {
      id: doc.id,
      status: doc.applicationStatus ?? 'new',
      submittedAt: doc.createdAt,
      program: program ? { id: program.id, title: program.title, slug: program.slug } : null,
      details: [
        { label: 'fullName', value: doc.fullName },
        { label: 'email', value: doc.email },
        { label: 'phone', value: doc.phone ?? '' },
        { label: 'profession', value: doc.profession ?? '' },
      ].filter((d): d is AccountApplication['details'][number] => !!d.value),
      // The URL is Payload's own file endpoint, which enforces the access rule on
      // `application-files`: it answers this student and staff, and nobody else.
      document: cv?.url
        ? { name: cv.originalName || cv.filename || '', url: cv.url, size: cv.filesize ?? null }
        : null,
    }
  },
)

/** The sessions of the student's program, with the join link gated exactly as in public. */
export const getAccountSessions = cache(
  async (application: AccountApplication | null, locale: Locale): Promise<PublicSession[]> =>
    application?.program ? listSessionsForProgram(locale, application.program.id) : [],
)

/** The materials of the student's program. */
export const getAccountMaterials = cache(
  async (application: AccountApplication | null, locale: Locale): Promise<Material[]> =>
    application?.program ? listMaterials(locale, application.program.slug) : [],
)
