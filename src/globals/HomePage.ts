import type { GlobalConfig } from 'payload'
import { previewURL } from '@/lib/preview'
import { anyone, staffOnly } from '@/access'
import type { Field } from 'payload'
import { localizedText, localizedTextarea, plainText, plainTextarea } from '@/fields'

const toggle = (name: string, label: { ar: string; en: string }, def = true) =>
  ({ name, type: 'checkbox', defaultValue: def, label }) as const

/** One home section: its switch and its texts, folded so the tab reads as a list. */
const section = (label: { ar: string; en: string }, fields: Field[]): Field => ({
  type: 'collapsible',
  label,
  admin: { initCollapsed: true },
  fields,
})

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: { ar: 'الصفحة الرئيسية', en: 'Home page' },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    livePreview: { url: ({ locale, req }) => previewURL(`/${locale.code}`, req) },
  },
  access: { read: anyone, update: staffOnly },
  // Autosaved drafts: the live-preview pane follows the typing, and nothing reaches visitors
  // until «Publish changes».
  versions: { drafts: { autosave: { interval: 400 } } },
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
              admin: {
                description: {
                  ar: 'الصورة الكاملة. تملأ الخلفية وتُعالَج بالكحلي.',
                  en: 'The full photograph. Fills the background, navy duotone applied.',
                },
              },
            },
            {
              name: 'heroCutout',
              type: 'upload',
              relationTo: 'media',
              label: {
                ar: 'الصورة نفسها بلا خلفية (PNG)',
                en: 'The same photo without its background (PNG)',
              },
              admin: {
                description: {
                  ar: 'نسخة PNG بخلفية شفافة من الصورة نفسها وبالإطار نفسه. تُوضَع فوق النقش، فيبدو النقش وكأنه يمرّ خلف المعلم.',
                  en: 'A transparent-background PNG of the same photo, same frame. It sits above the pattern, so the pattern seems to pass behind the subject.',
                },
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
          description: {
            ar: 'لكل قسم مفتاح إظهاره ونصوصه. الحقل الفارغ يُعرض بالنص الافتراضي. في العناوين، ضع الكلمة المميّزة بين نجمتين: لماذا **الأكاديمية**؟',
            en: 'Each section has its switch and its texts. An empty field shows the default text. In titles, wrap the accent word in double stars: Why the **Academy**?',
          },
          fields: [
            section({ ar: 'الرسالة والركائز', en: 'Mission & pillars' }, [
              toggle('showMission', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('missionTitle', { ar: 'العنوان', en: 'Title' }),
              localizedTextarea('missionText', { ar: 'نص الرسالة', en: 'Mission text' }),
              {
                name: 'pillars',
                type: 'array',
                localized: true,
                maxRows: 6,
                label: { ar: 'الركائز', en: 'Pillars' },
                labels: {
                  singular: { ar: 'ركيزة', en: 'Pillar' },
                  plural: { ar: 'الركائز', en: 'Pillars' },
                },
                fields: [
                  plainText('title', { ar: 'العنوان', en: 'Title' }, { required: true }),
                  plainTextarea('text', { ar: 'النص', en: 'Text' }, { required: true }),
                ],
              },
            ]),
            section({ ar: 'البرامج', en: 'Programs' }, [
              toggle('showPrograms', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('programsTitle', { ar: 'العنوان', en: 'Title' }),
              localizedTextarea('programsIntro', { ar: 'المقدّمة', en: 'Intro' }),
            ]),
            section({ ar: 'الموسم (الخط الزمني)', en: 'Season timeline' }, [
              toggle('showSeason', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('seasonTitle', { ar: 'العنوان', en: 'Title' }),
              localizedTextarea('seasonIntro', { ar: 'المقدّمة', en: 'Intro' }),
            ]),
            section({ ar: 'الحصص القادمة', en: 'Upcoming sessions' }, [
              toggle('showUpcoming', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('upcomingTitle', { ar: 'العنوان', en: 'Title' }),
              localizedTextarea('upcomingIntro', { ar: 'المقدّمة', en: 'Intro' }),
            ]),
            section({ ar: 'المخيم', en: 'Camp band' }, [
              toggle('showCamp', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('campTitle', { ar: 'العنوان', en: 'Title' }),
              localizedTextarea('campIntro', { ar: 'المقدّمة', en: 'Intro' }),
              localizedText('campCtaLabel', { ar: 'نص الزر', en: 'Button label' }),
            ]),
            section({ ar: 'من منبر الطوفان', en: 'From Minbar' }, [
              toggle('showMinbar', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('minbarTitle', { ar: 'العنوان', en: 'Title' }),
            ]),
            section({ ar: 'المحاضرون', en: 'Instructors' }, [
              toggle('showInstructors', { ar: 'إظهار القسم', en: 'Show this section' }),
              localizedText('instructorsTitle', { ar: 'العنوان', en: 'Title' }),
            ]),
            section({ ar: 'شريط الإحصاءات', en: 'Statistics band' }, [
              {
                ...toggle('showStats', { ar: 'إظهار القسم', en: 'Show this section' }, false),
                admin: {
                  description: {
                    ar: 'يظهر فقط إذا فُعّلت الإحصاءات وأُدخلت أرقام في إعدادات الموقع → الإحصاءات.',
                    en: 'Shows only when Site settings → Statistics is on and has figures.',
                  },
                },
              },
              localizedText('statsTitle', { ar: 'العنوان', en: 'Title' }),
            ]),
            section({ ar: 'الدعوة الختامية', en: 'Closing call' }, [
              localizedText('closingTitle', { ar: 'العنوان', en: 'Title' }),
              localizedTextarea('closingText', { ar: 'النص', en: 'Text' }),
            ]),
          ],
        },
      ],
    },
  ],
}
