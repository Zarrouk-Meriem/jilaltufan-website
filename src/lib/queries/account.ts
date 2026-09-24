import type { Where } from 'payload'
import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Account, Application, Instructor, Material } from '@/payload-types'
import type { EnrolledProgram } from '@/lib/enrollment/access'
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

    const cv = typeof doc.cv === 'object' && doc.cv ? doc.cv : null

    return {
      id: doc.id,
      status: doc.applicationStatus ?? 'new',
      submittedAt: doc.createdAt,
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

/**
 * The sessions of the programs the student may open (`enrolledPrograms`), with the join
 * link gated exactly as in public, soonest first.
 */
export const getAccountSessions = cache(
  async (programs: EnrolledProgram[], locale: Locale): Promise<PublicSession[]> => {
    const lists = await Promise.all(programs.map((p) => listSessionsForProgram(locale, p.id)))
    return lists.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  },
)

/** The materials of the programs the student may open, newest first. */
export const getAccountMaterials = cache(
  async (programs: EnrolledProgram[], locale: Locale): Promise<Material[]> => {
    const lists = await Promise.all(programs.map((p) => listMaterials(locale, p.slug)))
    return lists.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
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
      // Published only: a draft session is staff's work in progress, not a teaching slot.
      where: {
        and: [{ instructors: { contains: instructor.id } }, { status: { equals: 'published' } }],
      },
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
  async (account: Account, program: EnrolledProgram): Promise<Progress | null> => {
    const payload = await getClient()
    // This program's sessions only, and never a cancelled one: a session that did not
    // happen is not one the student could have attended (until 2026-09-24 it was counted).
    const held: Where = {
      and: [
        { program: { equals: program.id } },
        { status: { equals: 'published' } },
        { sessionStatus: { not_equals: 'cancelled' } },
      ],
    }
    const mine = (state: 'present' | 'excused'): Where => ({
      and: [
        { account: { equals: account.id } },
        { state: { equals: state } },
        { 'session.program': { equals: program.id } },
        { 'session.sessionStatus': { not_equals: 'cancelled' } },
      ],
    })
    const [total, attended, excused] = await Promise.all([
      payload.count({ collection: 'sessions', where: held, overrideAccess: true }),
      payload.count({ collection: 'attendance', where: mine('present'), overrideAccess: true }),
      payload.count({ collection: 'attendance', where: mine('excused'), overrideAccess: true }),
    ])
    if (total.totalDocs === 0) return null
    return { attended: attended.totalDocs, excused: excused.totalDocs, total: total.totalDocs }
  },
)
