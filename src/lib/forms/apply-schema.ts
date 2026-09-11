import { z } from 'zod'

/**
 * The application form, validated identically on the client and in the server
 * action. Error strings are message KEYS (apply.errors.*) so each side renders
 * them in the visitor's language.
 */
export const AGE_RANGES = ['under-18', '18-24', '25-34', '35-44', '45-plus'] as const

export const applySchema = z.object({
  program: z.string().min(1, 'required'),
  fullName: z.string().trim().min(2, 'required').max(120, 'tooLong'),
  email: z.email('email').max(200, 'tooLong'),
  phone: z.string().trim().max(40, 'tooLong').optional().or(z.literal('')),
  country: z.string().trim().min(2, 'required').max(80, 'tooLong'),
  city: z.string().trim().max(80, 'tooLong').optional().or(z.literal('')),
  ageRange: z.enum(AGE_RANGES, { error: 'required' }),
  motivation: z.string().trim().min(20, 'motivationShort').max(2000, 'tooLong'),
  hearAbout: z.string().trim().max(200, 'tooLong').optional().or(z.literal('')),
  consent: z.literal(true, { error: 'consent' }),
  locale: z.enum(['ar', 'en']),
  /** Honeypot: real browsers leave it empty. */
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
  turnstileToken: z.string().optional(),
})

export type ApplyInput = z.input<typeof applySchema>
export type ApplyData = z.output<typeof applySchema>

export type FieldErrors = Partial<Record<keyof ApplyData, string>>

/** Flatten a zod error into { field: messageKey }. */
export function toFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of err.issues) {
    const key = issue.path[0] as keyof ApplyData | undefined
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

/** Parse a FormData submission into the schema's input shape. */
export function formDataToInput(fd: FormData): ApplyInput {
  const s = (k: string) => {
    const v = fd.get(k)
    return typeof v === 'string' ? v : ''
  }
  return {
    program: s('program'),
    fullName: s('fullName'),
    email: s('email'),
    phone: s('phone'),
    country: s('country'),
    city: s('city'),
    ageRange: s('ageRange') as ApplyInput['ageRange'],
    motivation: s('motivation'),
    hearAbout: s('hearAbout'),
    consent:
      fd.get('consent') === 'on' || fd.get('consent') === 'true'
        ? true
        : (false as unknown as true),
    locale: (s('locale') === 'en' ? 'en' : 'ar') as 'ar' | 'en',
    website: s('website'),
    turnstileToken: s('cf-turnstile-response') || undefined,
  }
}
