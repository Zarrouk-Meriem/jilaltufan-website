import { z } from 'zod'

/**
 * What a guest instructor may send for their session: the document formats the academy
 * actually teaches from, and slides. No archives and no executables — a file here is opened
 * by staff and then by students, so the list stays to formats a reader expects.
 */
export const SESSION_FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const

export const SESSION_FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx'

/** 20 MB: a deck with images, and no more. Payload's own cap is the same. */
export const SESSION_FILE_MAX_BYTES = 20 * 1024 * 1024

export const sessionFileSchema = z.object({
  session: z.coerce.number().int().positive('required'),
  note: z.string().trim().max(500, 'tooLong').optional().or(z.literal('')),
  file: z
    .instanceof(File, { message: 'fileRequired' })
    .refine((f) => f.size > 0, 'fileRequired')
    .refine((f) => f.size <= SESSION_FILE_MAX_BYTES, 'fileTooBig')
    .refine(
      (f) =>
        (SESSION_FILE_MIME_TYPES as readonly string[]).includes(f.type) ||
        /\.(pdf|docx?|pptx?)$/i.test(f.name),
      'fileType',
    ),
})

export type SessionFileInput = z.input<typeof sessionFileSchema>
