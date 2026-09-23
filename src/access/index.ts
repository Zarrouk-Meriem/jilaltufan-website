import type { Access, FieldAccess, PayloadRequest } from 'payload'

type StaffUser = { role?: 'admin' | 'editor'; collection?: string } | null | undefined

const userOf = (req: PayloadRequest) => req.user as StaffUser

export const isStaffUser = (req: PayloadRequest) => {
  const u = userOf(req)
  return !!u && u.collection === 'users' && (u.role === 'admin' || u.role === 'editor')
}
export const isAdminUser = (req: PayloadRequest) => {
  const u = userOf(req)
  return !!u && u.collection === 'users' && u.role === 'admin'
}

export const staffOnly: Access = ({ req }) => isStaffUser(req)
export const adminOnly: Access = ({ req }) => isAdminUser(req)
export const anyone: Access = () => true
export const nobody: Access = () => false

/** Public sees published documents only; staff sees everything. */
export const publishedOrStaff: Access = ({ req }) =>
  isStaffUser(req) ? true : { status: { equals: 'published' } }

export const staffFieldOnly: FieldAccess = ({ req }) => isStaffUser(req)

/**
 * Staff can read and change themselves; admins manage everyone.
 *
 * `isStaffUser` rather than `req.user`: ids are per-collection, so once a second auth
 * collection existed, a signed-in account with id 7 matched the *staff user* with id 7 and
 * could read and update them — this guards both on `users` (found 2026-09-23, pinned in
 * `tests/unit/access.test.ts`). Anyone authenticated is not the same as anyone on staff.
 */
export const selfOrAdmin: Access = ({ req }) => {
  if (isAdminUser(req)) return true
  if (isStaffUser(req) && req.user) return { id: { equals: req.user.id } }
  return false
}

/**
 * Accounts — students and guest instructors (PLAN.md §13.2). They are a different auth
 * collection from staff, and every staff rule above keys on `collection === 'users'`, so an
 * account can never inherit a staff right by accident. These are the mirror image: an
 * account may read and change itself, staff may see them all, and nobody else sees anything.
 */
export const isAccount = (req: PayloadRequest) =>
  (req.user as { collection?: string } | null)?.collection === 'accounts'

export const accountSelfOrStaff: Access = ({ req }) => {
  if (isStaffUser(req)) return true
  if (isAccount(req) && req.user) return { id: { equals: req.user.id } }
  return false
}
