import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staffOnly } from '@/access'
import {
  localizedRichText,
  localizedText,
  localizedTextarea,
  publicMeta,
  seoField,
  plainText,
} from '@/fields'

const MONTHS = [
  ['sep', 'سبتمبر', 'September'],
  ['oct', 'أكتوبر', 'October'],
  ['nov', 'نوفمبر', 'November'],
  ['dec', 'ديسمبر', 'December'],
  ['jan', 'يناير', 'January'],
  ['feb', 'فبراير', 'February'],
  ['mar', 'مارس', 'March'],
  ['apr', 'أبريل', 'April'],
  ['may', 'مايو', 'May'],
  ['jun', 'يونيو', 'June'],
  ['jul', 'يوليو', 'July'],
  ['aug', 'أغسطس', 'August'],
] as const
const monthOptions = MONTHS.map(([value, ar, en]) => ({ value, label: { ar, en } }))

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: {
    singular: { ar: 'برنامج', en: 'Program' },
    plural: { ar: 'البرامج التدريبية', en: 'Programs' },
  },
  admin: {
    group: { ar: 'البرامج', en: 'Programs' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'track', 'registrationMode', 'status', 'order'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/programs/${data.slug}`,
    },
    preview: (data, { locale }) =>
      `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/programs/${data.slug}`,
    description: {
      ar: 'التدريب المفتوح والبرامج الموجّهة الخمسة. لكل برنامج صفحة خاصة وثماني حصص في الموسم.',
      en: 'Open Training and the five directed programs. Each has its own page and eight sessions per season.',
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: 'order',
  fields: [
    localizedText('title', { ar: 'اسم البرنامج', en: 'Program name' }, { required: true }),
    {
      name: 'track',
      type: 'select',
      required: true,
      defaultValue: 'directed',
      label: { ar: 'المسار', en: 'Track' },
      options: [
        { label: { ar: 'التدريب المفتوح', en: 'Open Training' }, value: 'open' },
        { label: { ar: 'برنامج موجّه', en: 'Directed program' }, value: 'directed' },
      ],
      admin: { position: 'sidebar' },
    },
    localizedTextarea(
      'shortDescription',
      { ar: 'وصف قصير', en: 'Short description' },
      {
        maxLength: 240,
        admin: {
          description: {
            ar: 'يظهر في البطاقات والفهارس. جملة أو جملتان.',
            en: 'Shown on cards and indexes. One or two sentences.',
          },
        },
      },
    ),
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'المحتوى', en: 'Content' },
          fields: [
            localizedRichText('intro', { ar: 'التعريف بالبرنامج', en: 'Introduction' }),
            {
              name: 'goals',
              type: 'array',
              localized: true,
              label: { ar: 'الأهداف', en: 'Goals' },
              labels: {
                singular: { ar: 'هدف', en: 'Goal' },
                plural: { ar: 'الأهداف', en: 'Goals' },
              },
              fields: [plainText('text', { ar: 'الهدف', en: 'Goal' }, { required: true })],
            },
            localizedRichText('targetAudience', { ar: 'الفئة المستهدفة', en: 'Target audience' }),
            localizedText(
              'durationSummary',
              { ar: 'ملخص المدة', en: 'Duration summary' },
              {
                admin: {
                  description: {
                    ar: 'مثال: 8 حصص، حصة واحدة شهريًا من سبتمبر إلى أبريل',
                    en: 'e.g. 8 sessions, one per month from September to April',
                  },
                },
              },
            ),
            localizedRichText('registrationNote', {
              ar: 'التسجيل والمتابعة',
              en: 'Registration & follow-up',
            }),
          ],
        },
        {
          label: { ar: 'الموسم', en: 'Season' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'seasonStartMonth',
                  type: 'select',
                  defaultValue: 'sep',
                  options: monthOptions,
                  label: { ar: 'شهر البداية', en: 'Start month' },
                },
                {
                  name: 'seasonEndMonth',
                  type: 'select',
                  defaultValue: 'apr',
                  options: monthOptions,
                  label: { ar: 'شهر النهاية', en: 'End month' },
                },
                {
                  name: 'sessionsCount',
                  type: 'number',
                  defaultValue: 8,
                  min: 1,
                  max: 24,
                  label: { ar: 'عدد الحصص', en: 'Sessions' },
                },
              ],
            },
            {
              name: 'instructors',
              type: 'relationship',
              relationTo: 'instructors',
              hasMany: true,
              label: { ar: 'المحاضرون', en: 'Instructors' },
            },
          ],
        },
        {
          label: { ar: 'التسجيل', en: 'Registration' },
          fields: [
            {
              name: 'registrationMode',
              type: 'select',
              required: true,
              defaultValue: 'application',
              label: { ar: 'طريقة التسجيل', en: 'Registration mode' },
              options: [
                {
                  label: { ar: 'مفتوح — التسجيل مباشر', en: 'Open — instant registration' },
                  value: 'open',
                },
                {
                  label: { ar: 'بطلب التحاق — يُراجع الطلب', en: 'Application — reviewed' },
                  value: 'application',
                },
                { label: { ar: 'مغلق', en: 'Closed' }, value: 'closed' },
              ],
            },
            {
              name: 'registrationDeadline',
              type: 'date',
              label: { ar: 'آخر موعد للتسجيل', en: 'Registration deadline' },
              admin: { date: { pickerAppearance: 'dayAndTime' } },
            },
          ],
        },
        { label: { ar: 'SEO', en: 'SEO' }, fields: [seoField()] },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'صورة الغلاف', en: 'Cover image' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'accentMotif',
      type: 'select',
      defaultValue: 'none',
      label: { ar: 'زخرفة البطاقة', en: 'Card motif' },
      admin: { position: 'sidebar' },
      options: [
        { label: { ar: 'بدون', en: 'None' }, value: 'none' },
        { label: { ar: 'نسيج الكوفية', en: 'Keffiyeh net' }, value: 'keffiyeh' },
        { label: { ar: 'العلامة في الزاوية', en: 'Corner mark' }, value: 'mark' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { ar: 'مميّز', en: 'Featured' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: { ar: 'الترتيب', en: 'Order' },
      admin: { position: 'sidebar' },
    },
    ...publicMeta(),
  ],
}
