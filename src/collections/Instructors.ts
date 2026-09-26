import type { CollectionConfig } from 'payload'
import { previewURL } from '@/lib/preview'
import { publishedOrStaff, staffFieldOnly, staffOnly } from '@/access'
import { inviteInstructorAccount } from './hooks/instructor-invite'
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
      url: ({ data, locale, req }) => previewURL(`/${locale.code}/instructors/${data.slug}`, req),
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: { afterChange: [inviteInstructorAccount] },
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
    // The guest's own way in (PLAN.md §13.3). The address is never published: this
    // collection is world-readable, and a field-level rule is the only thing standing
    // between a guest's inbox and the open REST endpoint.
    {
      name: 'contactEmail',
      type: 'email',
      index: true,
      label: { ar: 'بريد المحاضر', en: 'Instructor’s email' },
      access: { read: staffFieldOnly },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'للمراسلة والدعوة فقط، ولا يظهر على الموقع أبدًا.',
          en: 'For correspondence and the invite only; never shown on the site.',
        },
      },
    },
    {
      name: 'contactLocale',
      type: 'select',
      defaultValue: 'ar',
      label: { ar: 'لغة المراسلة', en: 'Correspondence language' },
      access: { read: staffFieldOnly },
      options: [
        { label: 'العربية', value: 'ar' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar', condition: (data) => !!data?.contactEmail },
    },
    {
      name: 'sendInvite',
      type: 'checkbox',
      defaultValue: false,
      label: { ar: 'أرسل دعوة', en: 'Send the invite' },
      access: { read: staffFieldOnly },
      admin: {
        position: 'sidebar',
        condition: (data) => !!data?.contactEmail,
        description: {
          ar: 'فعّل الخانة واحفظ ليصل المحاضر رابط اختيار كلمة السر ويفتح نافذته. لا تُرسل كلمة سر في بريد أبدًا.',
          en: 'Tick and save to send the guest a link to choose their own password and open their window. A password is never emailed.',
        },
      },
    },
    {
      name: 'inviteSentAt',
      type: 'date',
      label: { ar: 'أُرسلت الدعوة في', en: 'Invite sent' },
      access: { read: staffFieldOnly },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.inviteSentAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    seoField(),
    ...publicMeta('name'),
  ],
}
