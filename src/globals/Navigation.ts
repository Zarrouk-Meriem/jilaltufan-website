import type { GlobalConfig } from 'payload'
import { anyone, staffOnly } from '@/access'
import { localizedText } from '@/fields'

const linkRow = (required = true) => ({
  type: 'row' as const,
  fields: [
    localizedText('label', { ar: 'النص', en: 'Label' }, { required }),
    {
      name: 'href',
      type: 'text' as const,
      required,
      label: { ar: 'المسار', en: 'Path' },
      admin: {
        description: {
          ar: 'مسار داخلي مثل /programs أو رابط كامل.',
          en: 'Internal path like /programs, or a full URL.',
        },
      },
    },
  ],
})

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: { ar: 'القائمة الرئيسية', en: 'Navigation' },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    description: {
      ar: 'اتركها فارغة لاستخدام القائمة الافتراضية.',
      en: 'Leave empty to use the default menu.',
    },
  },
  access: { read: anyone, update: staffOnly },
  fields: [
    {
      name: 'primary',
      type: 'array',
      label: { ar: 'الروابط الرئيسية', en: 'Primary links' },
      maxRows: 6,
      fields: [linkRow()],
    },
    {
      name: 'utility',
      type: 'array',
      label: { ar: 'روابط مساعدة', en: 'Utility links' },
      maxRows: 3,
      fields: [linkRow()],
    },
    {
      name: 'cta',
      type: 'group',
      label: { ar: 'زر الدعوة', en: 'CTA' },
      admin: {
        description: {
          ar: 'اتركه فارغًا لعرض «سجّل الآن».',
          en: 'Leave empty to show "Apply now".',
        },
      },
      // Optional on purpose: a required group would block saving the menu without a CTA.
      fields: [linkRow(false)],
    },
  ],
}
