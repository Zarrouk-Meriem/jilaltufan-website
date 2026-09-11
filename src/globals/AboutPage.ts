import type { GlobalConfig } from 'payload'
import { anyone, staffOnly } from '@/access'
import { localizedRichText, localizedText, localizedTextarea } from '@/fields'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: { ar: 'صفحة الأكاديمية', en: 'About page' },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    livePreview: {
      url: ({ locale }) => `${process.env.NEXT_PUBLIC_SITE_URL}/${locale.code}/about`,
    },
  },
  access: { read: anyone, update: staffOnly },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'نبذة', en: 'About' },
          fields: [
            localizedText('title', { ar: 'العنوان', en: 'Title' }),
            localizedRichText('intro', { ar: 'نبذة عن الأكاديمية', en: 'About the Academy' }),
          ],
        },
        {
          label: { ar: 'الرؤية والرسالة', en: 'Vision & mission' },
          fields: [
            localizedTextarea('vision', { ar: 'الرؤية', en: 'Vision' }),
            localizedTextarea('mission', { ar: 'الرسالة', en: 'Mission' }),
            {
              name: 'pillars',
              type: 'array',
              label: { ar: 'الركائز', en: 'Pillars' },
              maxRows: 4,
              fields: [
                localizedText('title', { ar: 'الركيزة', en: 'Pillar' }, { required: true }),
                localizedTextarea('text', { ar: 'الشرح', en: 'Text' }),
              ],
            },
          ],
        },
        {
          label: { ar: 'الأهداف', en: 'Goals' },
          fields: [
            {
              name: 'goals',
              type: 'array',
              label: { ar: 'الأهداف', en: 'Goals' },
              fields: [localizedText('text', { ar: 'الهدف', en: 'Goal' }, { required: true })],
            },
          ],
        },
        {
          label: { ar: 'الهيكلة', en: 'Structure' },
          fields: [
            localizedRichText('structureIntro', { ar: 'مقدّمة الهيكلة', en: 'Structure intro' }),
            {
              name: 'structure',
              type: 'array',
              label: { ar: 'المجالس والفرق', en: 'Councils & teams' },
              fields: [
                localizedText('name', { ar: 'الاسم', en: 'Name' }, { required: true }),
                {
                  name: 'kind',
                  type: 'select',
                  defaultValue: 'council',
                  label: { ar: 'النوع', en: 'Kind' },
                  options: [
                    { label: { ar: 'مجلس', en: 'Council' }, value: 'council' },
                    { label: { ar: 'فريق', en: 'Team' }, value: 'team' },
                    { label: { ar: 'لجنة', en: 'Committee' }, value: 'committee' },
                  ],
                },
                localizedTextarea('description', { ar: 'الوصف', en: 'Description' }),
                {
                  name: 'members',
                  type: 'array',
                  label: { ar: 'الأعضاء', en: 'Members' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        localizedText('name', { ar: 'الاسم', en: 'Name' }, { required: true }),
                        localizedText('role', { ar: 'الدور', en: 'Role' }),
                      ],
                    },
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
