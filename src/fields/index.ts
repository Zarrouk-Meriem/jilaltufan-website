import type { Field } from 'payload'
import { slugify } from '@/lib/slug'

/** draft | published — public reads filter on `published`. */
export const statusField = (): Field => ({
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  label: { ar: 'الحالة', en: 'Status' },
  options: [
    { label: { ar: 'مسودّة', en: 'Draft' }, value: 'draft' },
    { label: { ar: 'منشور', en: 'Published' }, value: 'published' },
  ],
  admin: {
    position: 'sidebar',
    description: {
      ar: 'لا يظهر للزوار إلا ما هو "منشور".',
      en: 'Only "Published" is visible to visitors.',
    },
  },
})

/** Slug auto-generated from the Arabic title (transliterated); editable. */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  label: { ar: 'الرابط (slug)', en: 'Slug' },
  admin: {
    position: 'sidebar',
    description: {
      ar: 'يُولَّد تلقائيًا من العنوان العربي. أحرف لاتينية وأرقام وشرطات فقط.',
      en: 'Generated from the Arabic title. Latin letters, digits, and dashes only.',
    },
  },
  hooks: {
    beforeValidate: [
      ({ value, data, req }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = data?.[from]
        const title =
          typeof source === 'string' ? source : (source?.ar ?? source?.[req.locale ?? 'ar'])
        return typeof title === 'string' ? slugify(title) : value
      },
    ],
  },
})

export const isPlaceholderField = (): Field => ({
  name: 'isPlaceholder',
  type: 'checkbox',
  defaultValue: false,
  label: { ar: 'محتوى مؤقت', en: 'Placeholder content' },
  admin: {
    position: 'sidebar',
    description: {
      ar: 'علامة داخلية: هذا السجل يحتاج إلى محتوى حقيقي.',
      en: 'Internal flag: this record still needs real content.',
    },
  },
})

export const seoField = (): Field => ({
  name: 'seo',
  type: 'group',
  label: { ar: 'تحسين محركات البحث', en: 'SEO' },
  admin: {
    description: {
      ar: 'اختياري. يُستخدم العنوان والوصف الأساسيان إن تُرك فارغًا.',
      en: 'Optional. Falls back to the main title and description.',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: { ar: 'عنوان الصفحة', en: 'Page title' },
      maxLength: 70,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { ar: 'الوصف', en: 'Description' },
      maxLength: 160,
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'صورة المشاركة', en: 'Share image' },
    },
  ],
})

/** Sidebar bundle every public collection carries. */
export const publicMeta = (slugFrom = 'title'): Field[] => [
  statusField(),
  slugField(slugFrom),
  isPlaceholderField(),
]

export const localizedText = (
  name: string,
  label: { ar: string; en: string },
  opts: Partial<Field> = {},
): Field => ({ name, type: 'text', localized: true, label, ...opts }) as Field

export const localizedTextarea = (
  name: string,
  label: { ar: string; en: string },
  opts: Partial<Field> = {},
): Field => ({ name, type: 'textarea', localized: true, label, ...opts }) as Field

export const localizedRichText = (
  name: string,
  label: { ar: string; en: string },
  opts: Partial<Field> = {},
): Field => ({ name, type: 'richText', localized: true, label, ...opts }) as Field

/** Non-localized text for use INSIDE localized arrays (the array owns the locale). */
export const plainText = (
  name: string,
  label: { ar: string; en: string },
  opts: Partial<Field> = {},
): Field => ({ name, type: 'text', label, ...opts }) as Field
export const plainTextarea = (
  name: string,
  label: { ar: string; en: string },
  opts: Partial<Field> = {},
): Field => ({ name, type: 'textarea', label, ...opts }) as Field
