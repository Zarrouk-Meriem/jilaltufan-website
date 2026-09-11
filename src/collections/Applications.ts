import type { CollectionConfig } from 'payload'
import { nobody, staffOnly } from '@/access'

/**
 * Public create is deliberately `false`: submissions arrive through the apply
 * server action (zod → honeypot → rate limit → Local API with overrideAccess),
 * never through the open REST endpoint. See PLAN.md §2.4.
 */
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
    listSearchableFields: ['fullName', 'email', 'phone'],
    description: {
      ar: 'الطلبات الواردة من نموذج التسجيل. صفّها حسب البرنامج والحالة، وصدّرها كملف CSV من زر التصدير.',
      en: 'Submissions from the apply form. Filter by program and status; export CSV from the export button.',
    },
  },
  access: { read: staffOnly, create: nobody, update: staffOnly, delete: staffOnly },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      required: true,
      index: true,
      label: { ar: 'البرنامج', en: 'Program' },
    },
    {
      name: 'applicationStatus',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      label: { ar: 'حالة الطلب', en: 'Status' },
      admin: { position: 'sidebar' },
      options: [
        { label: { ar: 'جديد', en: 'New' }, value: 'new' },
        { label: { ar: 'قيد المراجعة', en: 'Reviewing' }, value: 'reviewing' },
        { label: { ar: 'مقبول', en: 'Accepted' }, value: 'accepted' },
        { label: { ar: 'قائمة انتظار', en: 'Waitlisted' }, value: 'waitlisted' },
        { label: { ar: 'مرفوض', en: 'Rejected' }, value: 'rejected' },
      ],
    },
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
          name: 'email',
          type: 'email',
          required: true,
          index: true,
          label: { ar: 'البريد الإلكتروني', en: 'Email' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', label: { ar: 'الهاتف / واتساب', en: 'Phone / WhatsApp' } },
        { name: 'country', type: 'text', label: { ar: 'البلد', en: 'Country' } },
        { name: 'city', type: 'text', label: { ar: 'المدينة', en: 'City' } },
      ],
    },
    {
      name: 'ageRange',
      type: 'select',
      label: { ar: 'الفئة العمرية', en: 'Age range' },
      options: ['under-18', '18-24', '25-34', '35-44', '45-plus'].map((v) => ({
        label: v,
        value: v,
      })),
    },
    { name: 'motivation', type: 'textarea', label: { ar: 'الدافع للالتحاق', en: 'Motivation' } },
    {
      name: 'hearAbout',
      type: 'text',
      label: { ar: 'كيف عرفت عن الأكاديمية؟', en: 'How did you hear about us?' },
    },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      label: { ar: 'الموافقة على سياسة الخصوصية', en: 'Privacy consent' },
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
      name: 'internalNotes',
      type: 'textarea',
      label: { ar: 'ملاحظات داخلية', en: 'Internal notes' },
      admin: { position: 'sidebar', description: { ar: 'للفريق فقط.', en: 'Staff only.' } },
    },
  ],
}
