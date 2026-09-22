import { describe, expect, it, vi } from 'vitest'
import { STATUS_EMAIL_STAMP, sendStatusEmail } from '@/collections/hooks/status-email'
import {
  acceptanceEmail,
  rejectionEmail,
  reviewingEmail,
  waitlistEmail,
} from '@/lib/email/templates'

type Status = 'new' | 'reviewing' | 'accepted' | 'waitlisted' | 'rejected'
type Doc = {
  id: number
  fullName: string
  email: string
  locale?: 'ar' | 'en' | null
  program?: number | { id: number } | null
  applicationStatus: Status
  sendRejectionEmail?: boolean | null
  reviewingEmailSentAt?: string | null
  acceptanceEmailSentAt?: string | null
  waitlistEmailSentAt?: string | null
  rejectionEmailSentAt?: string | null
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
  const result = await sendStatusEmail({
    doc,
    previousDoc,
    req: { payload },
    context,
    operation: 'update',
    collection: {},
    data: {},
  } as never)
  return { result: result as Doc, payload }
}

describe('status email hook — accepted', () => {
  it('emails the applicant in Arabic on the move to accepted, and stamps the time', async () => {
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
        context: { [STATUS_EMAIL_STAMP]: true },
      }),
    )
    expect(result.acceptanceEmailSentAt).toEqual(expect.any(String))
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
    expect(payload.sendEmail.mock.calls[0]![0]['text']).toContain('برنامجك: المسار المفتوح.')
  })

  it('falls back to the contact email as reply-to when no applications mailbox is set', async () => {
    const payload = fakePayload()
    payload.findGlobal.mockResolvedValueOnce({
      contactEmail: 'contact@example.test',
      applicationsEmail: '',
    })
    await run(base, { applicationStatus: 'new' }, payload)
    expect(payload.sendEmail.mock.calls[0]![0]['replyTo']).toBe('contact@example.test')
  })

  it('sends nothing when an accepted record is merely re-saved', async () => {
    const { payload } = await run(base, { applicationStatus: 'accepted' })
    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('sends again when the record leaves accepted and comes back', async () => {
    const { payload } = await run(base, { applicationStatus: 'waitlisted' })
    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
  })
})

describe('status email hook — reviewing', () => {
  it('emails on the move from new to reviewing with the two-week horizon', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'reviewing' },
      { applicationStatus: 'new' },
    )
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['subject']).toBe(reviewingEmail('ar', 'x').subject)
    expect(msg['text']).toContain('أسبوعين')
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reviewingEmailSentAt: expect.any(String) } }),
    )
  })

  it.each(['accepted', 'waitlisted', 'rejected'] as const)(
    'sends nothing when reviewing is reached backwards from %s',
    async (from) => {
      const { payload } = await run(
        { ...base, applicationStatus: 'reviewing' },
        { applicationStatus: from },
      )
      expect(payload.sendEmail).not.toHaveBeenCalled()
    },
  )

  it('sends nothing when a reviewing record is re-saved', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'reviewing' },
      { applicationStatus: 'reviewing' },
    )
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })
})

describe('status email hook — waitlisted', () => {
  it('emails on the move to waitlisted', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'waitlisted', locale: 'en' },
      { applicationStatus: 'reviewing' },
    )
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['subject']).toBe(waitlistEmail('en', 'x').subject)
    expect(msg['text']).toContain('no need to apply again')
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { waitlistEmailSentAt: expect.any(String) } }),
    )
  })
})

describe('status email hook — rejected', () => {
  it('sends nothing on the status change alone', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'rejected' },
      { applicationStatus: 'reviewing' },
    )
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('sends once the box is ticked, and stamps the time', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'rejected', sendRejectionEmail: true },
      { applicationStatus: 'rejected', sendRejectionEmail: false },
    )
    const msg = payload.sendEmail.mock.calls[0]![0]
    expect(msg['subject']).toBe(rejectionEmail('ar', 'x').subject)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { rejectionEmailSentAt: expect.any(String) } }),
    )
  })

  it('sends when status and tick arrive in the same save', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'rejected', sendRejectionEmail: true },
      { applicationStatus: 'reviewing', sendRejectionEmail: false },
    )
    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('sends nothing when a ticked rejected record is re-saved', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'rejected', sendRejectionEmail: true },
      { applicationStatus: 'rejected', sendRejectionEmail: true },
    )
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('a stale tick does not fire when the status moves elsewhere', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'new', sendRejectionEmail: true },
      { applicationStatus: 'rejected', sendRejectionEmail: true },
    )
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })
})

describe('status email hook — guards', () => {
  it('sends nothing for the new status', async () => {
    const { payload } = await run(
      { ...base, applicationStatus: 'new' },
      { applicationStatus: 'reviewing' },
    )
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('does not run again for its own stamping write', async () => {
    const { payload } = await run(base, { applicationStatus: 'new' }, fakePayload(), {
      [STATUS_EMAIL_STAMP]: true,
    })
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('logs a failed send, keeps the status change, and leaves the stamp empty', async () => {
    const payload = fakePayload({ fail: true })
    const { result } = await run(base, { applicationStatus: 'new' }, payload)
    expect(payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'status email failed', status: 'accepted', id: 7 }),
    )
    expect(payload.update).not.toHaveBeenCalled()
    expect(result.acceptanceEmailSentAt).toBeUndefined()
  })
})

describe('status email templates', () => {
  it('omits the program line when none is assigned, in both locales', () => {
    expect(acceptanceEmail('ar', 'ليلى').text).not.toContain('برنامجك:')
    expect(acceptanceEmail('en', 'Leila').text).not.toContain('Your program:')
    expect(acceptanceEmail('ar', 'ليلى', 'المسار').text).toContain('برنامجك: المسار.')
  })

  it('every template exists in both locales with a subject, text and html', () => {
    for (const t of [reviewingEmail, acceptanceEmail, waitlistEmail, rejectionEmail]) {
      for (const locale of ['ar', 'en'] as const) {
        const m = t(locale, 'X')
        expect(m.subject).toBeTruthy()
        expect(m.text).toContain('X')
        expect(m.html).toContain(`lang="${locale}"`)
      }
    }
  })
})
