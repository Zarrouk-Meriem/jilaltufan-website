import type { EmailAdapter } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { consoleAdapter, linksIn, withoutReservedRecipients } from '@/lib/payload/email'

describe('email console adapter', () => {
  it('extracts unique links from text and html', () => {
    expect(
      linksIn({
        text: 'Reset: http://localhost:3000/admin/reset/abc123',
        html: '<a href="http://localhost:3000/admin/reset/abc123">Reset</a> <a href="https://jilaltufan.org">site</a>',
      }),
    ).toEqual(['http://localhost:3000/admin/reset/abc123', 'https://jilaltufan.org'])
  })

  it('prints recipient, subject and links instead of dropping the email', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const adapter = consoleAdapter({ payload: {} as never })
    await adapter.sendEmail({
      to: 'admin@jilaltufan.org',
      subject: 'Reset your password',
      text: 'Go to http://localhost:3000/admin/reset/tok',
    })
    const out = info.mock.calls.map((c) => String(c[0])).join('\n')
    expect(out).toContain('to:      admin@jilaltufan.org')
    expect(out).toContain('subject: Reset your password')
    expect(out).toContain('link:    http://localhost:3000/admin/reset/tok')
    info.mockRestore()
  })
})

describe('reserved recipients are never delivered', () => {
  const payload = {} as never

  /** A stand-in provider that records what it was asked to deliver. */
  const provider = () => {
    const sent: string[] = []
    const adapter = () => ({
      defaultFromAddress: 'no-reply@jilaltufan.org',
      defaultFromName: 'Academy',
      name: 'spy',
      sendEmail: async (m: Parameters<ReturnType<EmailAdapter>['sendEmail']>[0]) => {
        sent.push(String(m.to))
        return 'sent'
      },
    })
    return { sent, adapter }
  }

  const reserved = [
    'playwright-1@example.com',
    'someone@example.net',
    'someone@example.org',
    'student@sub.example.com',
    'e2e-admin@example.test',
    'anyone@somewhere.invalid',
    'root@localhost',
  ]

  it.each(reserved)('logs %s instead of sending it', async (address) => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { sent, adapter } = provider()
    await withoutReservedRecipients(adapter)({ payload }).sendEmail({ to: address, subject: 's' })
    expect(sent, 'nothing should reach the provider').toEqual([])
    expect(info.mock.calls.map((c) => String(c[0])).join('\n')).toContain(address)
    info.mockRestore()
  })

  it('delivers a real address untouched', async () => {
    const { sent, adapter } = provider()
    await withoutReservedRecipients(adapter)({ payload }).sendEmail({
      to: 'someone@jilaltufan.org',
      subject: 's',
    })
    expect(sent).toEqual(['someone@jilaltufan.org'])
  })

  it('is not fooled by a real domain that merely contains the word', async () => {
    const { sent, adapter } = provider()
    await withoutReservedRecipients(adapter)({ payload }).sendEmail({
      to: 'someone@example.company.org',
      subject: 's',
    })
    expect(sent).toEqual(['someone@example.company.org'])
  })

  it('waits for a provider that resolves asynchronously', async () => {
    const { sent, adapter } = provider()
    await withoutReservedRecipients(Promise.resolve(adapter))({ payload }).sendEmail({
      to: 'someone@jilaltufan.org',
      subject: 's',
    })
    expect(sent).toEqual(['someone@jilaltufan.org'])
  })
})
