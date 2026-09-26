import type { GlobalConfig } from 'payload'
import { anyone, staffOnly } from '@/access'
import { localizedTextarea, plainText, plainTextarea } from '@/fields'

/**
 * Student window (/students). Every list here falls back to the built-in copy in
 * messages/*.json while it is empty, so the page never renders a hole.
 */
export const StudentsPage: GlobalConfig = {
  slug: 'students-page',
  label: { ar: 'نافذة الطالب', en: 'Student window' },
  admin: {
    group: { ar: 'النوافذ', en: 'Windows' },
    description: {
      ar: 'ما يُترك فارغًا هنا يُعرض بالنص الافتراضي.',
      en: 'Anything left empty here falls back to the default copy.',
    },
    livePreview: {
      url: ({ locale }) => `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/students`,
    },
  },
  access: { read: anyone, update: staffOnly },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'عام', en: 'General' },
          fields: [
            localizedTextarea('intro', { ar: 'المقدّمة', en: 'Intro' }, { maxLength: 300 }),
            {
              name: 'showAccountCard',
              type: 'checkbox',
              defaultValue: true,
              label: {
                ar: 'إظهار بطاقة «حسابي — قريبًا»',
                en: 'Show the "My account — soon" card',
              },
            },
          ],
        },
        {
          label: { ar: 'الحصص المباشرة', en: 'Live sessions' },
          fields: [
            {
              name: 'howSteps',
              type: 'array',
              localized: true,
              label: { ar: 'كيف تعمل الحصص المباشرة؟', en: 'How live sessions work' },
              admin: {
                description: {
                  ar: 'اكتب {minutes} حيث تريد إدراج نافذة الانضمام من إعدادات الموقع.',
                  en: 'Write {minutes} where the join window from Site settings should appear.',
                },
              },
              fields: [plainTextarea('text', { ar: 'النقطة', en: 'Point' }, { required: true })],
            },
            {
              name: 'joinSteps',
              type: 'array',
              localized: true,
              label: { ar: 'كيف أنضم إلى Zoom؟', en: 'How to join Zoom' },
              fields: [plainTextarea('text', { ar: 'الخطوة', en: 'Step' }, { required: true })],
            },
          ],
        },
        {
          label: { ar: 'ميثاق المشاركة', en: 'Code of conduct' },
          fields: [
            {
              name: 'conduct',
              type: 'array',
              localized: true,
              label: { ar: 'بنود الميثاق', en: 'Conduct points' },
              fields: [
                plainText('title', { ar: 'عنوان البند (اختياري)', en: 'Heading (optional)' }),
                plainTextarea('text', { ar: 'البند', en: 'Point' }, { required: true }),
              ],
            },
            {
              name: 'rights',
              type: 'array',
              localized: true,
              label: {
                ar: 'الحقوق التي تضمنها الأكاديمية للمشارك',
                en: 'Rights the Academy guarantees every participant',
              },
              fields: [
                plainText('title', { ar: 'عنوان الحق (اختياري)', en: 'Heading (optional)' }),
                plainTextarea('text', { ar: 'الحق', en: 'Right' }, { required: true }),
              ],
            },
          ],
        },
        {
          label: { ar: 'أسئلة شائعة', en: 'FAQ' },
          fields: [
            {
              name: 'faq',
              type: 'array',
              localized: true,
              label: { ar: 'الأسئلة', en: 'Questions' },
              fields: [
                plainText('question', { ar: 'السؤال', en: 'Question' }, { required: true }),
                plainTextarea('answer', { ar: 'الجواب', en: 'Answer' }, { required: true }),
              ],
            },
          ],
        },
      ],
    },
  ],
}
