import { randomInt } from 'node:crypto'
import type { CollectionConfig } from 'payload'
import { adminOnly, staffOnly } from '@/access'

/** No 0/O, 1/I/L: a number read aloud or typed from paper should not be ambiguous. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const newCertificateNumber = (year = new Date().getFullYear()) =>
  `JAA-${year}-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`

/**
 * A certificate the academy issued (user decisions, 2026-09-24): a graduation certificate
 * for a directed program, awarded by staff after the panel; an attendance certificate for
 * Open Training, issued by itself at the share set in Site settings. Issued by
 * `src/lib/certificates/issue.ts`, never typed in by hand.
 *
 * It keeps a snapshot — the names and the program's titles as they were when issued — so
 * it stays true and verifiable (`/verify/<number>`) even if the account or the program is
 * changed or deleted later; that is also why neither link is required. Staff can revoke
 * one; it is never deleted by anything but an admin.
 */
export const Certificates: CollectionConfig = {
  slug: 'certificates',
  labels: {
    singular: { ar: 'شهادة', en: 'Certificate' },
    plural: { ar: 'الشهادات', en: 'Certificates' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'number',
    defaultColumns: ['number', 'nameAr', 'programTitleAr', 'kind', 'issuedAt', 'revoked'],
    listSearchableFields: ['number', 'nameAr', 'nameEn'],
    description: {
      ar: 'الشهادات الصادرة. تصدر شهادة التخرّج حين يُعلَّم «تخرّج» في تسجيل الطالب، وشهادة الحضور تلقائيًا عند بلوغ نسبة الحضور المحدّدة في الإعدادات، وكلتاهما بعد أن يؤكّد الطالب اسمه الرسمي. يمكن إلغاء شهادة هنا، فتظهر في صفحة التحقق ملغاة.',
      en: 'Issued certificates. A graduation certificate is issued when «Graduated» is ticked on the student’s enrollment, an attendance certificate automatically at the share set in Site settings; both once the student has confirmed their official name. Revoking one here shows it as revoked on the verification page.',
    },
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminOnly },
  // One certificate of each kind per student per program.
  indexes: [{ fields: ['account', 'program', 'kind'], unique: true }],
  defaultSort: '-issuedAt',
  fields: [
    {
      name: 'number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { ar: 'رقم الشهادة', en: 'Certificate number' },
      defaultValue: () => newCertificateNumber(),
      admin: { readOnly: true },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: { ar: 'النوع', en: 'Kind' },
      options: [
        { label: { ar: 'شهادة تخرّج', en: 'Graduation' }, value: 'graduation' },
        { label: { ar: 'شهادة حضور', en: 'Attendance' }, value: 'attendance' },
      ],
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nameAr',
          type: 'text',
          required: true,
          label: { ar: 'الاسم (عربي)', en: 'Name (Arabic)' },
          admin: { readOnly: true },
        },
        {
          name: 'nameEn',
          type: 'text',
          required: true,
          label: { ar: 'الاسم (إنجليزي)', en: 'Name (English)' },
          admin: { readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'programTitleAr',
          type: 'text',
          required: true,
          label: { ar: 'البرنامج (عربي)', en: 'Program (Arabic)' },
          admin: { readOnly: true },
        },
        {
          name: 'programTitleEn',
          type: 'text',
          required: true,
          label: { ar: 'البرنامج (إنجليزي)', en: 'Program (English)' },
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'issuedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: { ar: 'تاريخ الإصدار', en: 'Issued on' },
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' },
      },
    },
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      index: true,
      label: { ar: 'الحساب', en: 'Account' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      index: true,
      label: { ar: 'البرنامج', en: 'Program' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'revoked',
      type: 'checkbox',
      defaultValue: false,
      label: { ar: 'ملغاة', en: 'Revoked' },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'تبقى الشهادة مسجّلة، وتقول صفحة التحقق إنها ملغاة.',
          en: 'The certificate stays on record; the verification page says it is revoked.',
        },
      },
    },
    {
      name: 'revokedReason',
      type: 'text',
      label: { ar: 'سبب الإلغاء (داخلي)', en: 'Reason (internal)' },
      admin: { position: 'sidebar', condition: (data) => !!data?.revoked },
    },
  ],
}
