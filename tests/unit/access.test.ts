import { describe, expect, it } from 'vitest'
import type { PayloadRequest } from 'payload'
import { accountSelfOrStaff, adminOnly, isAccount, selfOrAdmin, staffOnly } from '@/access'

/** Just enough of a request for an access rule: who is asking, and from which collection. */
const as = (user: { id: number; collection: string; role?: string } | null) =>
  ({ req: { user } }) as unknown as { req: PayloadRequest }

const admin = { id: 1, collection: 'users', role: 'admin' }
const editor = { id: 7, collection: 'users', role: 'editor' }
const student = { id: 7, collection: 'accounts' }

describe('staff rules never see an account as staff', () => {
  it('staffOnly and adminOnly refuse an account', () => {
    expect(staffOnly(as(student) as never)).toBe(false)
    expect(adminOnly(as(student) as never)).toBe(false)
  })
  it('staffOnly refuses nobody at all', () => {
    expect(staffOnly(as(null) as never)).toBe(false)
  })
})

describe('selfOrAdmin', () => {
  it('lets an admin manage everyone', () => {
    expect(selfOrAdmin(as(admin) as never)).toBe(true)
  })
  it('narrows an editor to their own row', () => {
    expect(selfOrAdmin(as(editor) as never)).toEqual({ id: { equals: 7 } })
  })
  /**
   * The bug this rule was written against: ids are per-collection, so an account with id 7
   * once matched the staff user with id 7 — and this rule guards both read and update on
   * `users`, so it was a way into someone else's staff row.
   */
  it('refuses an account, even one whose id matches a staff user', () => {
    expect(student.id).toBe(editor.id)
    expect(selfOrAdmin(as(student) as never)).toBe(false)
  })
  it('refuses nobody', () => {
    expect(selfOrAdmin(as(null) as never)).toBe(false)
  })
})

describe('accountSelfOrStaff', () => {
  it('lets staff see every account', () => {
    expect(accountSelfOrStaff(as(editor) as never)).toBe(true)
  })
  it('narrows an account to itself', () => {
    expect(accountSelfOrStaff(as(student) as never)).toEqual({ id: { equals: 7 } })
  })
  it('refuses nobody', () => {
    expect(accountSelfOrStaff(as(null) as never)).toBe(false)
  })
})

describe('isAccount', () => {
  it('is true only for the accounts collection', () => {
    expect(isAccount(as(student).req)).toBe(true)
    expect(isAccount(as(editor).req)).toBe(false)
    expect(isAccount(as(null).req)).toBe(false)
  })
})
