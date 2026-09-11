import type { GlobalConfig } from 'payload'
import { anyone, staffOnly } from '@/access'
import { localizedText, localizedTextarea } from '@/fields'

const toggle = (name: string, label: { ar: string; en: string }, def = true) =>
  ({ name, type: 'checkbox', defaultValue: def, label }) as const

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: { ar: 'الصفحة الرئيسية', en: 'Home page' },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    livePreview: { url: ({ locale }) => `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}` },
  },
  access: { read: anyone, update: staffOnly },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'المقدّمة', en: 'Hero' },
          fields: [
            localizedText(
              'heroTitle',
              { ar: 'العنوان', en: 'Title' },
              {
                admin: {
                  description: {
                    ar: 'ضع الكلمة المميّزة بين نجمتين: بالعلم **نتحرّر**',
                    en: 'Wrap the accent word in double stars: **liberated**',
                  },
                },
              },
            ),
            localizedTextarea(
              'heroSubtitle',
              { ar: 'الجملة التعريفية', en: 'One-line intro' },
              { maxLength: 400 },
            ),
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              label: {
                ar: 'صورة الخلفية (تُعالَج بالكحلي)',
                en: 'Background photo (navy duotone applied)',
              },
            },
            {
              type: 'row',
              fields: [
                localizedText('primaryCtaLabel', { ar: 'الزر الأول', en: 'Primary CTA' }),
                localizedText('secondaryCtaLabel', { ar: 'الزر الثاني', en: 'Secondary CTA' }),
              ],
            },
            toggle('showNextSession', { ar: 'إظهار الحصة القادمة', en: 'Show next session chip' }),
          ],
        },
        {
          label: { ar: 'الأقسام', en: 'Sections' },
          fields: [
            toggle('showMission', { ar: 'الرسالة والركائز', en: 'Mission & pillars' }),
            toggle('showPrograms', { ar: 'البرامج', en: 'Programs' }),
            toggle('showSeason', { ar: 'الموسم (الخط الزمني)', en: 'Season timeline' }),
            toggle('showUpcoming', { ar: 'الحصص القادمة', en: 'Upcoming sessions' }),
            toggle('showCamp', { ar: 'المخيم', en: 'Camp band' }),
            toggle('showMinbar', { ar: 'من منبر الطوفان', en: 'From Minbar' }),
            toggle('showInstructors', { ar: 'المحاضرون', en: 'Instructors' }),
            toggle('showStats', { ar: 'شريط الإحصاءات', en: 'Statistics band' }, false),
            localizedText('closingTitle', { ar: 'عنوان الدعوة الختامية', en: 'Closing CTA title' }),
            localizedTextarea('closingText', { ar: 'نص الدعوة الختامية', en: 'Closing CTA text' }),
          ],
        },
      ],
    },
  ],
}
