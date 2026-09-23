import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Account, Application, Instructor, Material, Program } from '@/payload-types'
import type { PublicSession } from './sessions'
import { getClient } from './client'
import { listMaterials } from './materials'
import { listSessionsForProgram, toPublic, type PublicSession as PS } from './sessions'
import { getSiteSettings } from './globals'

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

/** The public profile a guest instructor's account points at. */
export const getAccountInstructor = cache(
  async (account: Account, locale: Locale): Promise<Instructor | null> => {
    const id = idOf(account.instructor)
    if (!id) return null
    const payload = await getClient()
    return payload
      .findByID({
        collection: 'instructors',
        id,
        locale,
        fallbackLocale: 'ar',
        depth: 1,
        overrideAccess: true,
      })
      .catch(() => null)
  },
)

/**
 * The sessions a guest is teaching, with the join link on the same gate the public site
 * uses — the window is not a way around a field rule, it is simply where the person who
 * needs the link will look for it.
 */
export const getInstructorSessions = cache(
  async (instructor: Instructor | null, locale: Locale, now = new Date()): Promise<PS[]> => {
    if (!instructor) return []
    const [payload, settings] = await Promise.all([getClient(), getSiteSettings(locale)])
    const res = await payload.find({
      collection: 'sessions',
      where: { instructors: { contains: instructor.id } },
      locale,
      fallbackLocale: 'ar',
      sort: 'startsAt',
      depth: 1,
      limit: 50,
      overrideAccess: true,
    })
    const gate = {
      policy: settings.joinLinkVisibility,
      windowMinutes: settings.joinWindowMinutes,
      now,
    }
    return res.docs.map((d) => toPublic(d, gate))
  },
)

/** What this guest has already sent for their sessions. */
export type SentFile = { id: number; name: string; url: string | null; sessionId: number | null }

export const getInstructorFiles = cache(async (account: Account): Promise<SentFile[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'session-files',
    where: { sender: { equals: account.id } },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
  return res.docs.map((d) => ({
    id: d.id,
    name: d.originalName || d.filename || '',
    url: d.url ?? null,
    sessionId: idOf(d.session),
  }))
})

/**
 * How far through their program a student is: the sessions they were present at, against
 * the sessions the program holds. Excused absences are counted as what they are — not
 * present, but not the same as simply not coming — so the window can say both.
 */
export type Progress = { attended: number; excused: number; total: number }

export const getAccountProgress = cache(
  async (account: Account, application: AccountApplication | null): Promise<Progress | null> => {
    if (!application?.program) return null
    const payload = await getClient()
    const [total, attended, excused] = await Promise.all([
      payload.count({
        collection: 'sessions',
        where: {
          and: [
            { program: { equals: application.program.id } },
            { status: { equals: 'published' } },
          ],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'attendance',
        where: { and: [{ account: { equals: account.id } }, { state: { equals: 'present' } }] },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'attendance',
        where: { and: [{ account: { equals: account.id } }, { state: { equals: 'excused' } }] },
        overrideAccess: true,
      }),
    ])
    if (total.totalDocs === 0) return null
    return { attended: attended.totalDocs, excused: excused.totalDocs, total: total.totalDocs }
  },
)
