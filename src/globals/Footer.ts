import type { GlobalConfig } from 'payload'
import { anyone, staffOnly } from '@/access'
import { localizedText, localizedTextarea } from '@/fields'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: { ar: 'التذييل', en: 'Footer' },
  admin: { group: { ar: 'الإعدادات', en: 'Settings' } },
  access: { read: anyone, update: staffOnly },
  fields: [
    localizedTextarea(
      'blurb',
      { ar: 'النص التعريفي', en: 'Blurb' },
      {
        admin: {
          description: { ar: 'اتركه فارغًا لعرض الرسالة.', en: 'Leave empty to show the mission.' },
        },
      },
    ),
    {
      name: 'columns',
      type: 'array',
      label: { ar: 'الأعمدة', en: 'Columns' },
      maxRows: 3,
      fields: [
        localizedText('title', { ar: 'عنوان العمود', en: 'Column title' }, { required: true }),
        {
          name: 'links',
          type: 'array',
          label: { ar: 'الروابط', en: 'Links' },
          fields: [
            {
              type: 'row',
              fields: [
                localizedText('label', { ar: 'النص', en: 'Label' }, { required: true }),
                { name: 'href', type: 'text', required: true, label: { ar: 'المسار', en: 'Path' } },
              ],
            },
          ],
        },
      ],
    },
    localizedText(
      'note',
      { ar: 'ملاحظة السطر الأخير', en: 'Bottom-line note' },
      {
        admin: {
          description: {
            ar: 'الافتراضي: «جميع المواعيد بتوقيت القدس…»',
            en: 'Default: "All times are Al-Quds time…"',
          },
        },
      },
    ),
  ],
}
