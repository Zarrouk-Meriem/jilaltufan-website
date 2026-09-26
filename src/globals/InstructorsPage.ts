import type { GlobalConfig } from 'payload'
import { previewURL } from '@/lib/preview'
import { anyone, staffOnly } from '@/access'
import { localizedTextarea, plainTextarea } from '@/fields'

/** Instructor window (/instructors): the "for instructors" panel. Empty fields fall back to messages. */
export const InstructorsPage: GlobalConfig = {
  slug: 'instructors-page',
  label: { ar: 'نافذة المحاضر', en: 'Instructor window' },
  admin: {
    group: { ar: 'النوافذ', en: 'Windows' },
    description: {
      ar: 'ما يُترك فارغًا هنا يُعرض بالنص الافتراضي. المحاضرون أنفسهم يُضافون من قائمة «المحاضرون».',
      en: 'Anything left empty here falls back to the default copy. Instructors themselves are added under "Instructors".',
    },
    livePreview: {
      url: ({ locale, req }) => previewURL(`/${locale.code}/instructors`, req),
    },
  },
  access: { read: anyone, update: staffOnly },
  // Autosaved drafts: the live-preview pane follows the typing, and nothing reaches visitors
  // until «Publish changes».
  versions: { drafts: { autosave: { interval: 400 } } },
  fields: [
    localizedTextarea('intro', { ar: 'المقدّمة', en: 'Intro' }, { maxLength: 300 }),
    {
      name: 'guidelines',
      type: 'array',
      localized: true,
      label: { ar: 'إرشادات الحصة', en: 'Session guidelines' },
      fields: [plainTextarea('text', { ar: 'الإرشاد', en: 'Guideline' }, { required: true })],
    },
    localizedTextarea('materialsBody', { ar: 'مشاركة المواد', en: 'Sharing materials' }),
    localizedTextarea('scheduleBody', { ar: 'حصصي', en: 'My sessions' }),
  ],
}
