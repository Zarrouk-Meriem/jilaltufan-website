import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staffOnly } from '@/access'
import { localizedRichText, localizedText, localizedTextarea, publicMeta, seoField } from '@/fields'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: { ar: 'فعالية', en: 'Event' }, plural: { ar: 'الفعاليات', en: 'Events' } },
  admin: {
    group: { ar: 'الفعاليات', en: 'Events' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'startDate', 'status'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/events/${data.slug}`,
    },
    description: {
      ar: 'مخيمات جيل الطوفان (نوع "مخيم") والأنشطة والندوات.',
      en: 'The Jeel Al-Toufan Camp (type "camp"), activities, and seminars.',
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: '-startDate',
  fields: [
    localizedText('title', { ar: 'العنوان', en: 'Title' }, { required: true }),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'activity',
      label: { ar: 'النوع', en: 'Type' },
      admin: { position: 'sidebar' },
      options: [
        { label: { ar: 'مخيم', en: 'Camp' }, value: 'camp' },
        { label: { ar: 'نشاط', en: 'Activity' }, value: 'activity' },
        { label: { ar: 'ندوة', en: 'Seminar' }, value: 'seminar' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          label: { ar: 'تاريخ البداية', en: 'Start date' },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: { ar: 'تاريخ النهاية', en: 'End date' },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isOnline',
          type: 'checkbox',
          defaultValue: false,
          label: { ar: 'عن بُعد', en: 'Online' },
        },
        localizedText('location', { ar: 'المكان', en: 'Location' }),
      ],
    },
    localizedTextarea('summary', { ar: 'ملخّص', en: 'Summary' }, { maxLength: 300 }),
    localizedRichText('body', { ar: 'التفاصيل', en: 'Details' }),
    {
      name: 'programme',
      type: 'array',
      label: { ar: 'البرنامج اليومي', en: 'Programme' },
      labels: { singular: { ar: 'يوم', en: 'Day' }, plural: { ar: 'الأيام', en: 'Days' } },
      fields: [
        localizedText('dayTitle', { ar: 'عنوان اليوم', en: 'Day title' }, { required: true }),
        { name: 'date', type: 'date', label: { ar: 'التاريخ', en: 'Date' } },
        {
          name: 'items',
          type: 'array',
          label: { ar: 'الفقرات', en: 'Items' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'time',
                  type: 'text',
                  label: { ar: 'الوقت', en: 'Time' },
                  admin: { width: '25%' },
                },
                localizedText(
                  'title',
                  { ar: 'الفقرة', en: 'Item' },
                  { required: true, admin: { width: '75%' } },
                ),
              ],
            },
            localizedTextarea('description', { ar: 'الوصف', en: 'Description' }),
          ],
        },
      ],
    },
    {
      name: 'gallery',
      type: 'array',
      label: { ar: 'معرض الصور', en: 'Gallery' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: { ar: 'صورة', en: 'Image' },
        },
      ],
    },
    {
      name: 'registrationMode',
      type: 'select',
      defaultValue: 'none',
      label: { ar: 'التسجيل', en: 'Registration' },
      admin: { position: 'sidebar' },
      options: [
        { label: { ar: 'بدون تسجيل', en: 'None' }, value: 'none' },
        { label: { ar: 'رابط خارجي', en: 'External link' }, value: 'link' },
        { label: { ar: 'عبر نموذج الموقع', en: 'Site form' }, value: 'form' },
      ],
    },
    {
      name: 'registrationLink',
      type: 'text',
      label: { ar: 'رابط التسجيل', en: 'Registration link' },
      admin: { position: 'sidebar', condition: (data) => data?.registrationMode === 'link' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'صورة الغلاف', en: 'Cover image' },
      admin: { position: 'sidebar' },
    },
    seoField(),
    ...publicMeta(),
  ],
}
