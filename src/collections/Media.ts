import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { ar: 'ملف', en: 'Media' }, plural: { ar: 'الوسائط', en: 'Media' } },
  admin: { group: { ar: 'الإعدادات', en: 'Settings' } },
  access: { read: () => true },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 900 },
      { name: 'hero', width: 1920 },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { ar: 'النص البديل', en: 'Alt text' },
      admin: {
        description: {
          ar: 'وصف قصير للصورة لقارئات الشاشة. مطلوب.',
          en: 'Short description for screen readers. Required.',
        },
      },
    },
  ],
}
