import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staffOnly } from '@/access'
import { localizedRichText, localizedText, localizedTextarea, publicMeta, seoField } from '@/fields'

export const Instructors: CollectionConfig = {
  slug: 'instructors',
  labels: {
    singular: { ar: 'محاضر', en: 'Instructor' },
    plural: { ar: 'المحاضرون', en: 'Instructors' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'status'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/instructors/${data.slug}`,
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    localizedText('name', { ar: 'الاسم', en: 'Name' }, { required: true }),
    localizedText('role', { ar: 'الصفة / الدور', en: 'Title / role' }),
    localizedTextarea('shortBio', { ar: 'نبذة قصيرة', en: 'Short bio' }, { maxLength: 300 }),
    localizedRichText('bio', { ar: 'السيرة', en: 'Biography' }),
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'الصورة', en: 'Photo' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'links',
      type: 'array',
      label: { ar: 'روابط', en: 'Links' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, label: { ar: 'الاسم', en: 'Label' } },
            { name: 'url', type: 'text', required: true, label: { ar: 'الرابط', en: 'URL' } },
          ],
        },
      ],
    },
    {
      name: 'programs',
      type: 'join',
      collection: 'programs',
      on: 'instructors',
      label: { ar: 'البرامج', en: 'Programs' },
    },
    {
      name: 'sessions',
      type: 'join',
      collection: 'sessions',
      on: 'instructors',
      label: { ar: 'الحصص', en: 'Sessions' },
    },
    seoField(),
    ...publicMeta('name'),
  ],
}
