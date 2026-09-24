import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'
import { nobody, staffOnly } from '@/access'
import { mintStatusToken, statusUrl } from '@/lib/applications/status-token'
import { countryName, countryOptions } from '@/lib/countries'
import { GENDERS, HEAR_ABOUT } from '@/lib/forms/apply-schema'
import { sendStatusEmail } from './hooks/status-email'

/**
 * Every application carries its own follow-up link from the moment it is created, so the
 * confirmation letter can name it and the applicant never needs an account to see where
 * they stand. Only on create: a later save must not invalidate a link already sent.
 */
const mintOnCreate: CollectionBeforeChangeHook = ({ data, operation }) =>
  operation === 'create' ? { ...data, ...mintStatusToken() } : data

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
    defaultColumns: ['fullName', 'applicationStatus', 'country', 'createdAt'],
    listSearchableFields: ['fullName', 'email', 'phone', 'affiliationName'],
    description: {
      ar: 'الطلبات الواردة من نموذج التسجيل. صفّها حسب الحالة، وصدّرها كملف CSV من زر التصدير. البرنامج يختاره الطالب المقبول بنفسه (مجموعة «التسجيلات»).',
      en: 'Submissions from the apply form. Filter by status; export CSV from the export button. The program is chosen by the accepted student (see Enrollments).',
    },
  },
  access: { read: staffOnly, create: nobody, update: staffOnly, delete: staffOnly },
  hooks: { beforeChange: [mintOnCreate], afterChange: [sendStatusEmail] },
  defaultSort: '-createdAt',
  fields: [
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
          ar: 'يُرسَل بريد إلى المتقدّم بلغته عند الانتقال إلى «قيد المراجعة» (من «جديد» فقط) و«مقبول» و«قائمة انتظار»، مرة واحدة عند التغيير؛ ويظهر وقت كل إرسال أدناه. «مرفوض» لا يُرسل شيئًا إلا بعد تفعيل خانة الإرسال.',
          en: 'The applicant is emailed, in their language, on the move to Reviewing (from New only), Accepted, and Waitlisted — once, on the change; each send time appears below. Rejected sends nothing until the send box is ticked.',
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
      name: 'sendRejectionEmail',
      type: 'checkbox',
      defaultValue: false,
      label: { ar: 'أرسل رسالة الرفض', en: 'Send the rejection email' },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.applicationStatus === 'rejected',
        description: {
          ar: 'لا يُرسَل شيء عند اختيار «مرفوض» وحده. فعّل هذه الخانة واحفظ لإرسال رسالة الرفض؛ لا يمكن التراجع عن الإرسال.',
          en: 'Choosing Rejected alone sends nothing. Tick this and save to send the rejection email; it cannot be unsent.',
        },
      },
    },
    {
      name: 'reviewingEmailSentAt',
      type: 'date',
      label: { ar: 'أُرسل بريد المراجعة في', en: 'Reviewing email sent' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.reviewingEmailSentAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
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
      name: 'waitlistEmailSentAt',
      type: 'date',
      label: { ar: 'أُرسل بريد قائمة الانتظار في', en: 'Waitlist email sent' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.waitlistEmailSentAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'rejectionEmailSentAt',
      type: 'date',
      label: { ar: 'أُرسل بريد الرفض في', en: 'Rejection email sent' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.rejectionEmailSentAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    // The follow-up link (PLAN.md §13.3). The token is the whole secret, so it is never
    // shown as a field of its own; staff see the finished link, which is what they would
    // send if an applicant asks for it again.
    {
      name: 'statusToken',
      type: 'text',
      unique: true,
      label: { ar: 'رمز متابعة الطلب', en: 'Status link token' },
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'statusTokenExpiresAt',
      type: 'date',
      label: { ar: 'ينتهي رابط المتابعة في', en: 'Status link expires' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.statusTokenExpiresAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'statusLink',
      type: 'text',
      virtual: true,
      label: { ar: 'رابط متابعة الطلب', en: 'Status link' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.statusToken,
        description: {
          ar: 'الرابط الذي أُرسل مع رسالة الاستلام؛ يرى منه المتقدّم حالة طلبه وحدها. إن انتهت صلاحيته يطلب من الصفحة رابطًا جديدًا يصل إلى بريده.',
          en: 'The link sent with the confirmation letter; it shows the applicant their own status and nothing else. Once it expires, the page itself sends them a fresh one.',
        },
      },
      hooks: {
        afterRead: [
          ({ data }) =>
            data?.statusToken
              ? statusUrl(data.statusToken, data.locale === 'en' ? 'en' : 'ar')
              : undefined,
        ],
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
