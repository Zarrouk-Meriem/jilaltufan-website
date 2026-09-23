import { describe, expect, it } from 'vitest'
import { instructorInviteEmail } from '@/lib/email/templates'
import { fieldErrorsOf } from '@/lib/forms/account-schema'
import {
  SESSION_FILE_MAX_BYTES,
  SESSION_FILE_MIME_TYPES,
  sessionFileSchema,
} from '@/lib/forms/session-file-schema'

const file = (name: string, type: string, size = 1024) =>
  new File([new Uint8Array(size)], name, { type })

const errorsOf = (r: { success: false; error: Parameters<typeof fieldErrorsOf>[0] }) =>
  fieldErrorsOf(r.error)

describe('sessionFileSchema', () => {
  const ok = { session: '3', note: '', file: file('deck.pdf', 'application/pdf') }

  it('accepts a document for a session', () => {
    const r = sessionFileSchema.safeParse(ok)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.session).toBe(3)
  })

  it.each([...SESSION_FILE_MIME_TYPES])('accepts %s', (type) => {
    expect(sessionFileSchema.safeParse({ ...ok, file: file('f.pdf', type) }).success).toBe(true)
  })

  it('accepts a file whose type the browser did not name, by its extension', () => {
    expect(sessionFileSchema.safeParse({ ...ok, file: file('slides.pptx', '') }).success).toBe(true)
  })

  it('refuses anything else, however it is named', () => {
    const r = sessionFileSchema.safeParse({ ...ok, file: file('payload.zip', 'application/zip') })
    expect(errorsOf(r as never).file).toBe('fileType')
  })

  it('refuses an empty file', () => {
    const r = sessionFileSchema.safeParse({ ...ok, file: file('empty.pdf', 'application/pdf', 0) })
    expect(errorsOf(r as never).file).toBe('fileRequired')
  })

  it('refuses one over the ceiling, and accepts one exactly at it', () => {
    const over = file('big.pdf', 'application/pdf', SESSION_FILE_MAX_BYTES + 1)
    expect(errorsOf(sessionFileSchema.safeParse({ ...ok, file: over }) as never).file).toBe(
      'fileTooBig',
    )
    const at = file('big.pdf', 'application/pdf', SESSION_FILE_MAX_BYTES)
    expect(sessionFileSchema.safeParse({ ...ok, file: at }).success).toBe(true)
  })

  it('needs a session, and a real one', () => {
    expect(
      errorsOf(sessionFileSchema.safeParse({ ...ok, session: '' }) as never).session,
    ).toBeTruthy()
    expect(errorsOf(sessionFileSchema.safeParse({ ...ok, session: '0' }) as never).session).toBe(
      'required',
    )
  })

  it('caps the note rather than storing an essay', () => {
    const r = sessionFileSchema.safeParse({ ...ok, note: 'x'.repeat(501) })
    expect(errorsOf(r as never).note).toBe('tooLong')
  })
})

describe('the guest instructor’s invite', () => {
  const url = 'https://jilaltufan.org/ar/account/set-password?token=abc'

  it('says what the window is for — the guest did not ask for an account', () => {
    const mail = instructorInviteEmail('ar', 'ضيفنا', url)
    expect(mail.html).toContain(`href="${url}"`)
    expect(mail.text).toContain('موعد حصتك')
    expect(mail.text).toContain('المواد')
  })

  it('writes to an English-speaking guest in English', () => {
    const mail = instructorInviteEmail('en', 'Our guest', url)
    expect(mail.subject).toMatch(/invitation to teach/i)
    expect(mail.text).toContain('Choose your password')
  })

  it('never carries a password', () => {
    for (const locale of ['ar', 'en'] as const)
      expect(instructorInviteEmail(locale, 'x', url).text).not.toMatch(
        /كلمة السر الخاصة بك هي|your password is/i,
      )
  })
})
