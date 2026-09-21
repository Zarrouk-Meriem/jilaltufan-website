import { describe, expect, it, vi } from 'vitest'
import { ACCEPTANCE_STAMP, sendAcceptanceEmail } from '@/collections/hooks/acceptance-email'
import { acceptanceEmail } from '@/lib/email/templates'

type Doc = {
  id: number
  fullName: string
  email: string
  locale?: 'ar' | 'en' | null
  program?: number | { id: number } | null
  applicationStatus: 'new' | 'reviewing' | 'accepted' | 'waitlisted' | 'rejected'
  acceptanceEmailSentAt?: string | null
}

function fakePayload(opts: { fail?: boolean; programTitle?: string } = {}) {
  return {
    sendEmail: vi.fn(async (_message: Record<string, string>) => {
      if (opts.fail) throw new Error('smtp down')
    }),
    update: vi.fn(async () => ({})),
    findGlobal: vi.fn(async () => ({
      contactEmail: 'contact@example.test',
      applicationsEmail: 'applications@example.test',
    })),
    findByID: vi.fn(async () => ({ title: opts.programTitle ?? '' })),
    logger: { error: vi.fn() },
  }
}

const base: Doc = {
  id: 7,
  fullName: 'ليلى',
  email: 'leila@example.test',
  applicationStatus: 'accepted',
}

async function run(doc: Doc, previousDoc: Partial<Doc>, payload = fakePayload(), context = {}) {
  const result = await sendAcceptanceEmail({
    doc,
    previousDoc,
    req: { payload },
    context,
    operation: 'update',
    collection: {},
    data: {},
  } as never)
  return { result, payload }
}

describe('acceptance email hook', () => {
  it('emails the applicant in Arabic when the status becomes accepted, and stamps the time', async () => {
    const { result, payload } = await run(base, { applicationStatus: 'reviewing' })
    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['to']).toBe('leila@example.test')
    expect(msg['replyTo']).toBe('applications@example.test')
    expect(msg['subject']).toBe(acceptanceEmail('ar', 'ليلى').subject)
    expect(msg['text']).toContain('ليلى')
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'applications',
        id: 7,
        data: { acceptanceEmailSentAt: expect.any(String) },
        context: { [ACCEPTANCE_STAMP]: true },
      }),
    )
    expect((result as Doc).acceptanceEmailSentAt).toEqual(expect.any(String))
  })

  it('uses the applicant locale and names the program in that locale', async () => {
    const payload = fakePayload({ programTitle: 'Open Track' })
    await run({ ...base, locale: 'en', program: 3 }, { applicationStatus: 'new' }, payload)
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'programs', id: 3, locale: 'en' }),
    )
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['subject']).toBe(acceptanceEmail('en', 'x').subject)
    expect(msg['text']).toContain('Your program: Open Track.')
  })

  it('accepts a populated program relation too', async () => {
    const payload = fakePayload({ programTitle: 'المسار المفتوح' })
    await run({ ...base, program: { id: 9 } }, { applicationStatus: 'new' }, payload)
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ id: 9, locale: 'ar' }))
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['text']).toContain('برنامجك: المسار المفتوح.')
  })

  it('falls back to the contact email as reply-to when no applications mailbox is set', async () => {
    const payload = fakePayload()
    payload.findGlobal.mockResolvedValueOnce({
      contactEmail: 'contact@example.test',
      applicationsEmail: '',
    })
    await run(base, { applicationStatus: 'new' }, payload)
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['replyTo']).toBe('contact@example.test')
  })

  it('sends nothing when an accepted record is merely re-saved', async () => {
    const { payload } = await run(base, { applicationStatus: 'accepted' })
    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it.each(['new', 'reviewing', 'waitlisted', 'rejected'] as const)(
    'sends nothing for the %s status',
    async (applicationStatus) => {
      const { payload } = await run({ ...base, applicationStatus }, { applicationStatus: 'new' })
      expect(payload.sendEmail).not.toHaveBeenCalled()
    },
  )

  it('does not run again for its own stamping write', async () => {
    const { payload } = await run(base, { applicationStatus: 'new' }, fakePayload(), {
      [ACCEPTANCE_STAMP]: true,
    })
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('logs a failed send, keeps the status change, and leaves the stamp empty', async () => {
    const payload = fakePayload({ fail: true })
    const { result } = await run(base, { applicationStatus: 'new' }, payload)
    expect(payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'acceptance email failed', id: 7 }),
    )
    expect(payload.update).not.toHaveBeenCalled()
    expect((result as Doc).acceptanceEmailSentAt).toBeUndefined()
  })
})

describe('acceptance email template', () => {
  it('omits the program line when none is assigned, in both locales', () => {
    expect(acceptanceEmail('ar', 'ليلى').text).not.toContain('برنامجك:')
    expect(acceptanceEmail('en', 'Leila').text).not.toContain('Your program:')
    expect(acceptanceEmail('ar', 'ليلى', 'المسار').text).toContain('برنامجك: المسار.')
  })
})
