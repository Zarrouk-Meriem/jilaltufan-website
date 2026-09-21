import type { CollectionConfig, Field } from 'payload'
import { nobody, staffOnly } from '@/access'
import { countryName, countryOptions } from '@/lib/countries'
import { GENDERS, HEAR_ABOUT } from '@/lib/forms/apply-schema'
import { sendAcceptanceEmail } from './hooks/acceptance-email'

/**
 * Public create is deliberately `false`: submissions arrive through the apply
 * server action (zod → honeypot → rate limit → Local API with overrideAccess),
 * never through the open REST endpoint. See PLAN.md §2.4.
 *
 * The fields mirror the academy's intake sheet in three groups: basic information,
 * affiliation and links, motivation with CV and pledge.
 */
const countryField = (name: string, label: { ar: string; en: string }): Field => ({
  name,
  type: 'select',
  label,
  index: true,
  options: countryOptions('ar').map((o) => ({
    value: o.value,
    label: { ar: o.label, en: countryName(o.value, 'en') },
  })),
})

const HEAR_ABOUT_LABELS: Record<(typeof HEAR_ABOUT)[number], { ar: string; en: string }> = {
  social: { ar: 'وسائل التواصل الاجتماعي', en: 'Social media' },
  friend: { ar: 'صديق أو زميل', en: 'A friend or colleague' },
  organisation: { ar: 'مؤسسة أو جمعية', en: 'An organisation or association' },
  event: { ar: 'فعالية أو مخيم', en: 'An event or camp' },
  search: { ar: 'البحث على الإنترنت', en: 'Web search' },
  other: { ar: 'أخرى', en: 'Other' },
}

export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: {
    singular: { ar: 'طلب التحاق', en: 'Application' },
    plural: { ar: 'طلبات الالتحاق', en: 'Applications' },
  },
  admin: {
    group: { ar: 'الطلبات', en: 'Submissions' },
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'program', 'applicationStatus', 'country', 'createdAt'],
    listSearchableFields: ['fullName', 'email', 'phone', 'affiliationName'],
    description: {
      ar: 'الطلبات الواردة من نموذج التسجيل. صفّها حسب البرنامج والحالة، وصدّرها كملف CSV من زر التصدير.',
      en: 'Submissions from the apply form. Filter by program and status; export CSV from the export button.',
    },
  },
  access: { read: staffOnly, create: nobody, update: staffOnly, delete: staffOnly },
  hooks: { afterChange: [sendAcceptanceEmail] },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      index: true,
      label: { ar: 'البرنامج', en: 'Program' },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'الطلب عام للأكاديمية؛ يُحدَّد البرنامج هنا بعد القبول.',
          en: 'Applications are to the academy; set the program here after acceptance.',
        },
      },
    },
    {
      name: 'applicationStatus',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      label: { ar: 'حالة الطلب', en: 'Status' },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'عند تغيير الحالة إلى «مقبول» يُرسَل بريد القبول تلقائيًا إلى المتقدّم بلغته، ويظهر وقت الإرسال أدناه. الحالات الأخرى لا تُرسل شيئًا.',
          en: 'Setting the status to Accepted emails the applicant automatically, in their language; the time appears below. The other statuses send nothing.',
        },
      },
      options: [
        { label: { ar: 'جديد', en: 'New' }, value: 'new' },
        { label: { ar: 'قيد المراجعة', en: 'Reviewing' }, value: 'reviewing' },
        { label: { ar: 'مقبول', en: 'Accepted' }, value: 'accepted' },
        { label: { ar: 'قائمة انتظار', en: 'Waitlisted' }, value: 'waitlisted' },
        { label: { ar: 'مرفوض', en: 'Rejected' }, value: 'rejected' },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'المعلومات الأساسية', en: 'Basic information' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'fullName',
                  type: 'text',
                  required: true,
                  label: { ar: 'الاسم الكامل', en: 'Full name' },
                },
                {
                  name: 'gender',
                  type: 'select',
                  label: { ar: 'الجنس', en: 'Gender' },
                  options: GENDERS.map((value) => ({
                    value,
                    label:
                      value === 'female' ? { ar: 'أنثى', en: 'Female' } : { ar: 'ذكر', en: 'Male' },
                  })),
                },
                {
                  name: 'dateOfBirth',
                  type: 'date',
                  label: { ar: 'تاريخ الميلاد', en: 'Date of birth' },
                  admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                  required: true,
                  index: true,
                  label: { ar: 'البريد الإلكتروني', en: 'Email' },
                },
                { name: 'phone', type: 'text', label: { ar: 'رقم الهاتف', en: 'Phone' } },
              ],
            },
            {
              type: 'row',
              fields: [
                countryField('nationality', { ar: 'الجنسية', en: 'Nationality' }),
                countryField('country', { ar: 'بلد الإقامة', en: 'Country of residence' }),
                { name: 'profession', type: 'text', label: { ar: 'المهنة', en: 'Profession' } },
              ],
            },
          ],
        },
        {
          label: { ar: 'الانتماء والحضور', en: 'Affiliation & presence' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'affiliated',
                  type: 'checkbox',
                  defaultValue: false,
                  label: {
                    ar: 'ينتمي إلى حركة أو مؤسسة أو مبادرة أو جمعية',
                    en: 'Belongs to a movement, organisation, initiative, or association',
                  },
                },
                {
                  name: 'affiliationName',
                  type: 'text',
                  label: { ar: 'اسم الجهة', en: 'Name of the body' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'facebook', type: 'text', label: { ar: 'فيسبوك', en: 'Facebook' } },
                { name: 'instagram', type: 'text', label: { ar: 'إنستغرام', en: 'Instagram' } },
                { name: 'linkedin', type: 'text', label: { ar: 'لينكدإن', en: 'LinkedIn' } },
              ],
            },
          ],
        },
        {
          label: { ar: 'الدوافع', en: 'Motivation' },
          fields: [
            {
              name: 'hearAbout',
              type: 'select',
              label: { ar: 'كيف تعرّف على الأكاديمية؟', en: 'How they heard about the Academy' },
              options: HEAR_ABOUT.map((value) => ({ value, label: HEAR_ABOUT_LABELS[value] })),
            },
            {
              name: 'motivation',
              type: 'textarea',
              label: { ar: 'لماذا يريد الالتحاق؟', en: 'Why they want to join' },
            },
            {
              name: 'aboutYou',
              type: 'textarea',
              label: { ar: 'عن نفسه', en: 'About them' },
            },
            {
              name: 'cv',
              type: 'upload',
              relationTo: 'application-files',
              label: { ar: 'السيرة الذاتية', en: 'CV' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'pledge',
                  type: 'checkbox',
                  required: true,
                  label: { ar: 'تعهّد بالالتزام', en: 'Commitment pledge' },
                },
                {
                  name: 'consent',
                  type: 'checkbox',
                  required: true,
                  label: { ar: 'الموافقة على سياسة الخصوصية', en: 'Privacy consent' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'locale',
      type: 'select',
      options: [
        { label: 'العربية', value: 'ar' },
        { label: 'English', value: 'en' },
      ],
      label: { ar: 'لغة المتقدّم', en: 'Applicant locale' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'acceptanceEmailSentAt',
      type: 'date',
      label: { ar: 'أُرسل بريد القبول في', en: 'Acceptance email sent' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.acceptanceEmailSentAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: { ar: 'ملاحظات داخلية', en: 'Internal notes' },
      admin: { position: 'sidebar', description: { ar: 'للفريق فقط.', en: 'Staff only.' } },
    },
  ],
}
