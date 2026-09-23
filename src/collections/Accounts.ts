import type { CollectionConfig } from 'payload'
import { accountSelfOrStaff, adminOnly, staffFieldOnly, staffOnly } from '@/access'

/**
 * Everyone who is not staff: a student of the academy, or a guest instructor
 * (PLAN.md §13.2). Separate from `users` because staff rights are keyed on that
 * collection, and separate from the public `instructors` profile because Payload injects
 * the auth `email` field with no access control — credentials cannot live in a collection
 * the world can read. The account points at the profile, never the other way round.
 *
 * Nobody here reaches the Payload admin: `access.admin` is a flat `false`. The windows are
 * pages on the site, signed in through our own forms.
 *
 * An account is normally created by the system — the acceptance hook for a student, the
 * invite for a guest — with a password nobody knows, and the person sets their own from the
 * link in their letter. Staff can create one by hand for a case the system did not cover;
 * the password they type then is thrown away by the same invite.
 */
export const Accounts: CollectionConfig = {
  slug: 'accounts',
  labels: { singular: { ar: 'حساب', en: 'Account' }, plural: { ar: 'الحسابات', en: 'Accounts' } },
  auth: {
    // A season is long and a student should not be signed out between sessions.
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
    // The same token carries an invite and a password reset. A day is long enough to open a
    // letter and short enough to be worth expiring; an expired link asks for a new one on
    // the page itself, so it is never a dead end.
    forgotPassword: { expiration: 24 * 60 * 60 * 1000 },
  },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'kind', 'inviteSentAt', 'createdAt'],
    listSearchableFields: ['email', 'name'],
    description: {
      ar: 'حسابات الطلبة والمحاضرين الضيوف. تُنشأ تلقائيًا عند القبول أو عند دعوة ضيف، ويختار صاحبها كلمة السر بنفسه من الرابط المرسل إليه — لا تُرسل كلمة سر في بريد أبدًا. هذه الحسابات لا تدخل لوحة الإدارة.',
      en: 'Student and guest-instructor accounts. Created on acceptance or when a guest is invited; the person chooses their own password from the link in their letter — a password is never emailed. These accounts cannot enter the admin.',
    },
  },
  access: {
    read: accountSelfOrStaff,
    create: staffOnly,
    update: accountSelfOrStaff,
    delete: adminOnly,
    unlock: staffOnly,
    // Never the Payload admin, whatever else goes wrong.
    admin: () => false,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'student',
      index: true,
      label: { ar: 'نوع الحساب', en: 'Account type' },
      access: { update: staffFieldOnly },
      options: [
        { label: { ar: 'طالب', en: 'Student' }, value: 'student' },
        { label: { ar: 'محاضر ضيف', en: 'Guest instructor' }, value: 'instructor' },
      ],
    },
    { name: 'name', type: 'text', label: { ar: 'الاسم', en: 'Name' } },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'ar',
      label: { ar: 'لغة المراسلة', en: 'Correspondence language' },
      options: [
        { label: 'العربية', value: 'ar' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'application',
      type: 'relationship',
      relationTo: 'applications',
      index: true,
      label: { ar: 'الطلب', en: 'Application' },
      access: { update: staffFieldOnly },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.kind === 'student',
        description: {
          ar: 'الطلب الذي نشأ عنه هذا الحساب.',
          en: 'The application this account came from.',
        },
      },
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'instructors',
      index: true,
      label: { ar: 'ملف المحاضر', en: 'Instructor profile' },
      access: { update: staffFieldOnly },
      admin: { position: 'sidebar', condition: (data) => data?.kind === 'instructor' },
    },
    {
      name: 'inviteSentAt',
      type: 'date',
      label: { ar: 'أُرسلت الدعوة في', en: 'Invite sent' },
      access: { update: staffFieldOnly },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.inviteSentAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'passwordSetAt',
      type: 'date',
      label: { ar: 'اختار كلمة السر في', en: 'Password chosen' },
      access: { update: staffFieldOnly },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.passwordSetAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
        description: {
          ar: 'فارغ يعني أن صاحب الحساب لم يفعّل حسابه بعد.',
          en: 'Empty means the person has not activated their account yet.',
        },
      },
    },
  ],
}
