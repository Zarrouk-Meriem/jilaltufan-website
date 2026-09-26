import { z } from 'zod'
import { isCountryCode } from '@/lib/countries'
import { isValidPhoneNumber } from 'libphonenumber-js/min'
import { normalizePhone } from '@/lib/dial-codes'

/**
 * The application form, validated identically on the client and in the server
 * action. Error strings are message KEYS (apply.errors.*) so each side renders
 * them in the visitor's language. The fields follow the academy's own intake
 * sheet: basic information · affiliation and links · motivation, CV, and pledge.
 */
export const GENDERS = ['female', 'male'] as const
export const HEAR_ABOUT = ['social', 'friend', 'organisation', 'event', 'search', 'other'] as const

export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
export const CV_ACCEPT = '.pdf,.doc,.docx'

const optionalText = (max: number) =>
  z.string().trim().max(max, 'tooLong').optional().or(z.literal(''))
const country = z.string().refine(isCountryCode, 'required')

/** A plausible date of birth: a real calendar day, in the past, under 100 years ago. */
const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'required')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`)
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return false
    const now = new Date()
    const min = new Date(Date.UTC(now.getUTCFullYear() - 100, now.getUTCMonth(), now.getUTCDate()))
    return d < now && d > min
  }, 'dateOfBirth')

/**
 * The CV arrives as a File from FormData on the server and from the file input on the
 * client; a bare string is what an untouched `<input type="file">` registers as. Anything
 * empty means "no file" — and a CV is required (user decision, 2026-09-26; it was optional
 * until then, so older applications may have none).
 */
const cv = z
  .unknown()
  .transform((v) => {
    if (v instanceof File && v.size > 0) return v
    if (v && typeof v === 'object' && 'length' in v && typeof (v as FileList).item === 'function')
      return (v as FileList).item(0) ?? undefined
    return undefined
  })
  .refine((f) => !!f, 'required')
  .refine((f) => !f || f.size <= CV_MAX_BYTES, 'cvTooLarge')
  .refine(
    (f) =>
      !f || (CV_MIME_TYPES as readonly string[]).includes(f.type) || /\.(pdf|docx?)$/i.test(f.name),
    'cvType',
  )

/**
 * «اسم الجهة» is required exactly when the visitor says they belong to one. This is a
 * discriminated union rather than an object-level refinement on purpose: zod skips
 * object refinements while any sibling field has a hard error, and the stepper
 * validates step 2 while step 3 is still empty, so a refinement would never run there.
 */
const affiliationRule = z.discriminatedUnion(
  'affiliated',
  [
    z.object({
      affiliated: z.literal('yes'),
      affiliationName: z.string().trim().min(1, 'required').max(160, 'tooLong'),
    }),
    z.object({ affiliated: z.literal('no'), affiliationName: optionalText(160) }),
  ],
  { error: 'required' },
)

/**
 * Object shape and cross-field rules are separate so the client can extend the shape
 * (the honeypot is a server-only check) and still apply the same rules.
 */
export const applyObject = z.object({
  // 1 · basic information
  fullName: z.string().trim().min(2, 'required').max(120, 'tooLong'),
  gender: z.enum(GENDERS, { error: 'required' }),
  dateOfBirth,
  email: z.email('email').max(200, 'tooLong'),
  phone: z
    .string()
    .trim()
    .max(40, 'tooLong')
    .transform(normalizePhone)
    .refine((v) => v.startsWith('+') && isValidPhoneNumber(v), 'phone'),
  nationality: country,
  country,
  profession: z.string().trim().min(2, 'required').max(120, 'tooLong'),
  // 2 · affiliation and presence
  affiliated: z.enum(['yes', 'no'], { error: 'required' }),
  affiliationName: optionalText(160),
  facebook: optionalText(200),
  instagram: optionalText(200),
  linkedin: optionalText(200),
  // 3 · motivation
  hearAbout: z.enum(HEAR_ABOUT, { error: 'required' }),
  motivation: z.string().trim().min(20, 'motivationShort').max(2000, 'tooLong'),
  aboutYou: z.string().trim().min(20, 'aboutShort').max(2000, 'tooLong'),
  cv,
  pledge: z.literal(true, { error: 'pledge' }),
  consent: z.literal(true, { error: 'consent' }),
  locale: z.enum(['ar', 'en']),
  /** Honeypot: real browsers leave it empty. */
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
  turnstileToken: z.string().optional(),
})

export const withApplyRules = <T extends z.ZodObject<z.ZodRawShape>>(schema: T) =>
  z.intersection(schema, affiliationRule)

export const applySchema = withApplyRules(applyObject)

export type ApplyInput = z.input<typeof applySchema>
export type ApplyData = z.output<typeof applySchema>

export type FieldErrors = Partial<Record<keyof ApplyData, string>>

/** Which fields each step owns — the stepper validates a step before leaving it. */
export const STEP_FIELDS: readonly (readonly (keyof ApplyInput)[])[] = [
  ['fullName', 'gender', 'dateOfBirth', 'email', 'phone', 'nationality', 'country', 'profession'],
  ['affiliated', 'affiliationName', 'facebook', 'instagram', 'linkedin'],
  ['hearAbout', 'motivation', 'aboutYou', 'cv', 'pledge', 'consent'],
]

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
  const checked = (k: string) =>
    fd.get(k) === 'on' || fd.get(k) === 'true' ? true : (false as unknown as true)
  const file = fd.get('cv')
  return {
    fullName: s('fullName'),
    gender: s('gender') as ApplyInput['gender'],
    dateOfBirth: s('dateOfBirth'),
    email: s('email'),
    phone: s('phone'),
    nationality: s('nationality'),
    country: s('country'),
    profession: s('profession'),
    affiliated: s('affiliated') as ApplyInput['affiliated'],
    affiliationName: s('affiliationName'),
    facebook: s('facebook'),
    instagram: s('instagram'),
    linkedin: s('linkedin'),
    hearAbout: s('hearAbout') as ApplyInput['hearAbout'],
    motivation: s('motivation'),
    aboutYou: s('aboutYou'),
    cv: file instanceof File && file.size > 0 ? file : undefined,
    pledge: checked('pledge'),
    consent: checked('consent'),
    locale: (s('locale') === 'en' ? 'en' : 'ar') as 'ar' | 'en',
    website: s('website'),
    turnstileToken: s('cf-turnstile-response') || undefined,
  }
}
