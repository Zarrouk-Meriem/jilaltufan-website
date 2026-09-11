import type { GlobalConfig } from 'payload'
import { anyone, staffOnly } from '@/access'
import { localizedText } from '@/fields'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { ar: 'إعدادات الموقع', en: 'Site settings' },
  admin: { group: { ar: 'الإعدادات', en: 'Settings' } },
  access: { read: anyone, update: staffOnly },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'عام', en: 'General' },
          fields: [
            {
              name: 'contactEmail',
              type: 'email',
              required: true,
              defaultValue: 'contact@jilaltufan.com',
              label: { ar: 'بريد التواصل', en: 'Contact email' },
              admin: {
                description: {
                  ar: 'يستقبل إشعارات الطلبات والرسائل.',
                  en: 'Receives application and contact notifications.',
                },
              },
            },
            {
              name: 'whatsapp',
              type: 'text',
              label: { ar: 'رقم واتساب (اختياري)', en: 'WhatsApp number (optional)' },
            },
            {
              name: 'academyTimeZone',
              type: 'text',
              required: true,
              defaultValue: 'Asia/Hebron',
              label: { ar: 'المنطقة الزمنية للأكاديمية', en: 'Academy time zone' },
              validate: (v: unknown) => {
                try {
                  new Intl.DateTimeFormat('en', { timeZone: String(v) })
                  return true
                } catch {
                  return 'منطقة زمنية غير صالحة (IANA)'
                }
              },
              admin: {
                description: {
                  ar: 'اسم IANA. يُعرض للزوار باسم «بتوقيت القدس».',
                  en: 'IANA name. Shown to visitors as "Al-Quds time".',
                },
              },
            },
            {
              name: 'socials',
              type: 'array',
              label: { ar: 'الشبكات الاجتماعية', en: 'Social links' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: [
                        'instagram',
                        'x',
                        'facebook',
                        'youtube',
                        'telegram',
                        'tiktok',
                        'linkedin',
                        'other',
                      ].map((v) => ({ label: v, value: v })),
                    },
                    { name: 'url', type: 'text', required: true, label: 'URL' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: { ar: 'الحصص المباشرة', en: 'Live sessions' },
          fields: [
            {
              name: 'joinLinkVisibility',
              type: 'select',
              required: true,
              defaultValue: 'window',
              label: { ar: 'إظهار روابط Zoom', en: 'Join-link visibility' },
              options: [
                {
                  label: { ar: 'دائمًا — الروابط عامة', en: 'Always — links are public' },
                  value: 'always',
                },
                {
                  label: {
                    ar: 'ضمن نافذة — قبل البداية بـ 30 دقيقة حتى النهاية',
                    en: 'Window — 30 min before start until the end',
                  },
                  value: 'window',
                },
                {
                  label: {
                    ar: 'بالبريد فقط — لا تُعرض على الموقع',
                    en: 'Email only — never shown on the site',
                  },
                  value: 'email-only',
                },
              ],
            },
            {
              name: 'joinWindowMinutes',
              type: 'number',
              defaultValue: 30,
              min: 0,
              max: 240,
              label: {
                ar: 'نافذة الانضمام (دقائق قبل البداية)',
                en: 'Join window (minutes before start)',
              },
            },
          ],
        },
        {
          label: { ar: 'شريط الإعلان', en: 'Announcement bar' },
          fields: [
            {
              name: 'announcementEnabled',
              type: 'checkbox',
              defaultValue: false,
              label: { ar: 'إظهار الشريط', en: 'Show bar' },
            },
            localizedText('announcementText', { ar: 'النص', en: 'Text' }),
            {
              name: 'announcementLink',
              type: 'text',
              label: { ar: 'الرابط (اختياري)', en: 'Link (optional)' },
            },
          ],
        },
        {
          label: { ar: 'الإحصاءات', en: 'Statistics' },
          fields: [
            {
              name: 'statsEnabled',
              type: 'checkbox',
              defaultValue: false,
              label: { ar: 'إظهار شريط الإحصاءات', en: 'Show statistics band' },
              admin: {
                description: {
                  ar: 'اتركه مطفأً حتى تتوفر أرقام حقيقية.',
                  en: 'Keep off until real numbers exist.',
                },
              },
            },
            {
              name: 'stats',
              type: 'array',
              label: { ar: 'الأرقام', en: 'Figures' },
              maxRows: 4,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'value',
                      type: 'text',
                      required: true,
                      label: { ar: 'القيمة', en: 'Value' },
                    },
                    localizedText('label', { ar: 'التسمية', en: 'Label' }, { required: true }),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
