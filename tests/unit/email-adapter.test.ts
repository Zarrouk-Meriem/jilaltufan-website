import { describe, expect, it, vi } from 'vitest'
import { consoleAdapter, linksIn } from '@/lib/payload/email'

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
