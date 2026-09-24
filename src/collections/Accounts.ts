import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
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
  hooks: {
    // Their rows go first: enrollments, attendance and badge awards require an account, so the database
    // would otherwise refuse the delete (their links are NOT NULL).
    beforeDelete: [
      async ({ id, req }) => {
        for (const collection of ['enrollments', 'attendance', 'badge-awards'] as const)
          await req.payload.delete({
            collection,
            where: { account: { equals: id } },
            overrideAccess: true,
            req,
          })
      },
    ],
    // Runs after the password has been checked, so saying why is safe: only the owner of
    // the account can reach this answer (the sign-in action shows `errors.disabled`).
    beforeLogin: [
      ({ user }) => {
        if ((user as { disabled?: boolean | null }).disabled)
          throw new APIError('account-disabled', 403)
      },
    ],
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
      // Spelled as the student wants them printed; a certificate waits until both exist,
      // and keeps the names it was issued with (a later edit does not rewrite it).
      type: 'row',
      admin: { condition: (data) => data?.kind !== 'instructor' },
      fields: [
        {
          name: 'officialNameAr',
          type: 'text',
          maxLength: 120,
          label: { ar: 'الاسم الرسمي بالعربية', en: 'Official name (Arabic)' },
          admin: {
            description: {
              ar: 'كما يُطبع في الشهادة. يكتبه الطالب من نافذته.',
              en: 'As printed on certificates. The student fills it in from their window.',
            },
          },
        },
        {
          name: 'officialNameEn',
          type: 'text',
          maxLength: 120,
          label: { ar: 'الاسم الرسمي بالإنجليزية', en: 'Official name (English)' },
        },
      ],
    },
    {
      name: 'disabled',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: { ar: 'موقوف', en: 'Deactivated' },
      access: { update: staffFieldOnly },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'الحساب الموقوف لا يدخل، ولا يرى شيئًا من البرامج ولا الحصص، ولو كان داخلًا وقت الإيقاف. يبقى السجلّ كما هو.',
          en: 'A deactivated account cannot sign in or see any program or session, even if it was signed in at the time. The record stays as it is.',
        },
      },
    },
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
