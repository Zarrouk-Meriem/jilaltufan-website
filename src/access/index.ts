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

/** Users can read/update themselves; admins manage everyone. */
export const selfOrAdmin: Access = ({ req }) => {
  if (isAdminUser(req)) return true
  if (req.user) return { id: { equals: req.user.id } }
  return false
}
