import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staffOnly } from '@/access'
import { localizedRichText, localizedText, localizedTextarea, publicMeta, seoField } from '@/fields'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: { ar: 'مشروع', en: 'Project' },
    plural: { ar: 'المشاريع والمبادرات', en: 'Projects & initiatives' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'projectStatus', 'status'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/projects/${data.slug}`,
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    localizedText('title', { ar: 'العنوان', en: 'Title' }, { required: true }),
    localizedTextarea('summary', { ar: 'ملخّص', en: 'Summary' }, { maxLength: 300 }),
    localizedRichText('body', { ar: 'التفاصيل', en: 'Details' }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'الصورة', en: 'Image' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'projectStatus',
      type: 'select',
      defaultValue: 'ongoing',
      label: { ar: 'حالة المشروع', en: 'Project status' },
      admin: { position: 'sidebar' },
      options: [
        { label: { ar: 'قيد التنفيذ', en: 'Ongoing' }, value: 'ongoing' },
        { label: { ar: 'قادم', en: 'Upcoming' }, value: 'upcoming' },
        { label: { ar: 'منجَز', en: 'Completed' }, value: 'completed' },
      ],
    },
    seoField(),
    ...publicMeta(),
  ],
}
