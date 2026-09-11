import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'required').max(120, 'tooLong'),
  email: z.email('email').max(200, 'tooLong'),
  subject: z.string().trim().min(2, 'required').max(150, 'tooLong'),
  message: z.string().trim().min(10, 'messageShort').max(4000, 'tooLong'),
  locale: z.enum(['ar', 'en']),
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
})
export type ContactInput = z.input<typeof contactSchema>
export type ContactData = z.output<typeof contactSchema>

export function contactFormDataToInput(fd: FormData): ContactInput {
  const s = (k: string) => (typeof fd.get(k) === 'string' ? (fd.get(k) as string) : '')
  return {
    name: s('name'),
    email: s('email'),
    subject: s('subject'),
    message: s('message'),
    locale: s('locale') === 'en' ? 'en' : 'ar',
    website: s('website'),
  }
}
