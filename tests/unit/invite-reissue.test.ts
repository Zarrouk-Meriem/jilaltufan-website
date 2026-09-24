import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { reissueExpiredInvite } from '@/lib/accounts/reissue'

const NOW = new Date('2026-09-24T12:00:00Z')
const HOUR_AGO = '2026-09-24T11:00:00.000Z'
const IN_AN_HOUR = '2026-09-24T13:00:00.000Z'

/** Just what the re-issue reads and writes, recording the letter it sends. */
function fakePayload(account: Record<string, unknown> | null) {
  const sent: Record<string, string>[] = []
  const payload = {
    db: { findOne: vi.fn(async () => account) },
    forgotPassword: vi.fn(async () => 'fresh-token'),
    findGlobal: vi.fn(async () => ({ contactEmail: 'contact@example.test' })),
    sendEmail: vi.fn(async (m: Record<string, string>) => void sent.push(m)),
    logger: { error: () => {} },
  } as unknown as Payload
  return { payload, sent }
}

const invite = {
  id: 1,
  email: 'student@example.test',
  name: 'ليلى',
  locale: 'ar',
  passwordSetAt: null,
  disabled: false,
  resetPasswordExpiration: HOUR_AGO,
}

describe('reissueExpiredInvite', () => {
  it('sends a fresh link to the address on the account when an unused invite expired', async () => {
    const { payload, sent } = fakePayload(invite)
    expect(await reissueExpiredInvite(payload, 'old', NOW)).toBe(true)
    expect(sent).toHaveLength(1)
    expect(sent[0]!.to).toBe('student@example.test')
    expect(sent[0]!.text).toContain('fresh-token')
    expect(sent[0]!.subject).toBe('رابط جديد لتفعيل حسابك')
  })

  it('does nothing for a link that is still valid (the password form handles it)', async () => {
    const { payload, sent } = fakePayload({ ...invite, resetPasswordExpiration: IN_AN_HOUR })
    expect(await reissueExpiredInvite(payload, 'old', NOW)).toBe(false)
    expect(sent).toHaveLength(0)
  })

  it('never re-issues for someone who already chose a password (a used or reset link)', async () => {
    const { payload, sent } = fakePayload({ ...invite, passwordSetAt: HOUR_AGO })
    expect(await reissueExpiredInvite(payload, 'old', NOW)).toBe(false)
    expect(sent).toHaveLength(0)
  })

  it('does nothing for an unknown token or a deactivated account', async () => {
    for (const account of [null, { ...invite, disabled: true }]) {
      const { payload, sent } = fakePayload(account)
      expect(await reissueExpiredInvite(payload, 'old', NOW)).toBe(false)
      expect(sent).toHaveLength(0)
    }
  })
})
