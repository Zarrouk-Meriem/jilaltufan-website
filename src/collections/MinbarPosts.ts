import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staffOnly } from '@/access'
import { localizedRichText, localizedText, localizedTextarea, publicMeta, seoField } from '@/fields'

export const MinbarPosts: CollectionConfig = {
  slug: 'minbar-posts',
  labels: {
    singular: { ar: 'مقال', en: 'Post' },
    plural: { ar: 'منبر الطوفان', en: 'Minbar Al-Toufan' },
  },
  admin: {
    group: { ar: 'المعرفة', en: 'Knowledge' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/knowledge/minbar/${data.slug}`,
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: '-publishedAt',
  fields: [
    localizedText('title', { ar: 'العنوان', en: 'Title' }, { required: true }),
    localizedTextarea('excerpt', { ar: 'مقتطف', en: 'Excerpt' }, { maxLength: 300 }),
    localizedRichText('body', { ar: 'النص', en: 'Body' }, { required: true }),
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'صورة الغلاف', en: 'Cover' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'instructors',
      label: { ar: 'الكاتب (محاضر)', en: 'Author (instructor)' },
      admin: { position: 'sidebar' },
    },
    localizedText(
      'authorName',
      { ar: 'الكاتب (نص حر)', en: 'Author (free text)' },
      {
        admin: {
          position: 'sidebar',
          description: {
            ar: 'يُستخدم إن لم يكن الكاتب من المحاضرين.',
            en: 'Used when the author is not an instructor.',
          },
        },
      },
    ),
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: { ar: 'تاريخ النشر', en: 'Published at' },
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'tags',
      type: 'array',
      label: { ar: 'الوسوم', en: 'Tags' },
      fields: [localizedText('tag', { ar: 'وسم', en: 'Tag' }, { required: true })],
    },
    seoField(),
    ...publicMeta(),
  ],
}
