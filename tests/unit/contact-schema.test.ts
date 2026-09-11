import { describe, expect, it } from 'vitest'
import { contactFormDataToInput, contactSchema } from '@/lib/forms/contact-schema'

describe('contactSchema', () => {
  it('accepts a valid message', () => {
    expect(
      contactSchema.safeParse({
        name: 'اسم',
        email: 'a@b.co',
        subject: 'سؤال',
        message: 'أريد معرفة مواعيد الحصص القادمة.',
        locale: 'ar',
        website: '',
      }).success,
    ).toBe(true)
  })
  it('rejects a short message and a filled honeypot with message keys', () => {
    const r = contactSchema.safeParse({
      name: '',
      email: 'x',
      subject: '',
      message: 'hi',
      locale: 'en',
      website: 'spam',
    })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues.map((i) => `${String(i.path[0])}:${i.message}`)).toEqual(
        expect.arrayContaining([
          'name:required',
          'email:email',
          'subject:required',
          'message:messageShort',
          'website:spam',
        ]),
      )
  })
  it('parses FormData', () => {
    const fd = new FormData()
    fd.set('name', 'n')
    fd.set('locale', 'en')
    expect(contactFormDataToInput(fd)).toMatchObject({ name: 'n', locale: 'en', website: '' })
  })
})
