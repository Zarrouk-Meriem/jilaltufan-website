import type { Access, CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'
import { adminOnly, isAccount, isStaffUser, staffOnly } from '@/access'
import { checkEnrollment, type Refusal, type Track } from '@/lib/enrollment/rules'
import type { Enrollment } from '@/payload-types'

/**
 * Who is enrolled in which program (user decision, 2026-09-24; rules in
 * `src/lib/enrollment/rules.ts`). One row per student per program. An accepted student
 * enrolls themselves from their window; staff can enroll, move (change the program) or
 * withdraw a student here. A withdrawn row is kept, not deleted, so the history stays.
 *
 * Access to a program's sessions, join links and materials needs an `enrolled` row here,
 * an application that is still `accepted`, and an account that is not deactivated
 * (`src/lib/enrollment/access.ts`).
 */
const ownOrStaff: Access = ({ req }) => {
  if (isStaffUser(req)) return true
  if (!isAccount(req) || !req.user) return false
  return { account: { equals: req.user.id } }
}

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? Number((v as { id: unknown }).id)
      : null

const REFUSALS: Record<Refusal | 'not-student', { ar: string; en: string }> = {
  'not-enrollable': {
    ar: 'المشاريع الاستراتيجية ليست برنامجًا يُسجَّل فيه.',
    en: 'Strategic projects are not a program anyone enrolls in.',
  },
  closed: {
    ar: 'التسجيل في هذا البرنامج مغلق.',
    en: 'Enrollment in this program is closed.',
  },
  'already-enrolled': {
    ar: 'هذا الطالب مسجّل في هذا البرنامج من قبل.',
    en: 'This student is already enrolled in this program.',
  },
  'other-directed': {
    ar: 'هذا الطالب مسجّل في برنامج موجّه آخر؛ لا يُسجَّل في أكثر من برنامج موجّه واحد في آن.',
    en: 'This student is already in another directed program; one directed program at a time.',
  },
  'not-student': {
    ar: 'التسجيل للطلبة وحدهم، لا لحسابات المحاضرين.',
    en: 'Only student accounts enroll, not instructor accounts.',
  },
}

const enforceRules: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const staff = isStaffUser(req)
  const next: Partial<Enrollment> = {
    ...(data as Partial<Enrollment>),
    // Who made the row is taken from the request, never from the body.
    ...(staff ? { source: 'staff' } : {}),
  }
  const state = next.state ?? originalDoc?.state ?? 'enrolled'
  if (state !== 'enrolled') return next

  const accountId = idOf(next.account ?? originalDoc?.account)
  const programId = idOf(next.program ?? originalDoc?.program)
  if (!accountId || !programId) return next // `required` reports it

  const lang = req.i18n?.language === 'en' ? 'en' : 'ar'
  const refuse = (reason: Refusal | 'not-student', path: string): never => {
    throw new ValidationError({
      collection: 'enrollments',
      errors: [{ path, message: REFUSALS[reason][lang] }],
      req,
    })
  }

  const [account, program, existing] = await Promise.all([
    req.payload.findByID({
      collection: 'accounts',
      id: accountId,
      depth: 0,
      overrideAccess: true,
      req,
    }),
    req.payload.findByID({
      collection: 'programs',
      id: programId,
      depth: 0,
      overrideAccess: true,
      req,
    }),
    req.payload.find({
      collection: 'enrollments',
      where: { account: { equals: accountId } },
      depth: 1,
      limit: 20,
      overrideAccess: true,
      req,
    }),
  ])
  if (account.kind !== 'student') refuse('not-student', 'account')

  const check = checkEnrollment({
    program: {
      id: program.id,
      track: (program.track ?? 'directed') as Track,
      registrationMode: program.registrationMode,
      published: program.status === 'published',
    },
    existing: existing.docs.map((e) => {
      const p = typeof e.program === 'object' && e.program ? e.program : null
      return {
        id: e.id,
        programId: idOf(e.program) ?? 0,
        track: ((p?.track as Track | undefined) ?? 'directed') as Track,
        active: e.state === 'enrolled',
      }
    }),
    by: staff ? 'staff' : 'student',
    enrollmentId: originalDoc?.id,
  })
  if (!check.ok) refuse(check.reason, 'program')
  return next
}

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  labels: {
    singular: { ar: 'تسجيل', en: 'Enrollment' },
    plural: { ar: 'التسجيلات', en: 'Enrollments' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'id',
    defaultColumns: ['account', 'program', 'state', 'source', 'createdAt'],
    description: {
      ar: 'من سجّل في أي برنامج. يسجّل الطالب المقبول نفسه من نافذته: التدريب المفتوح، وبرنامج موجّه واحد لا غير. يمكن للفريق هنا أن يسجّل طالبًا، أو ينقله إلى برنامج آخر بتغيير البرنامج، أو يُلغي تسجيله.',
      en: 'Who is enrolled in which program. An accepted student enrolls from their window: Open Training, and one directed program only. Staff can enroll a student here, move them by changing the program, or withdraw them.',
    },
  },
  access: { read: ownOrStaff, create: staffOnly, update: staffOnly, delete: adminOnly },
  // One row per student per program, declared here so `next dev`'s schema push keeps it.
  indexes: [{ fields: ['account', 'program'], unique: true }],
  hooks: { beforeChange: [enforceRules] },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
      index: true,
      label: { ar: 'الطالب', en: 'Student' },
      filterOptions: { kind: { equals: 'student' } },
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      required: true,
      index: true,
      label: { ar: 'البرنامج', en: 'Program' },
      filterOptions: { track: { in: ['open', 'directed'] } },
    },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'enrolled',
      index: true,
      label: { ar: 'الحالة', en: 'State' },
      options: [
        { label: { ar: 'مسجّل', en: 'Enrolled' }, value: 'enrolled' },
        { label: { ar: 'أُلغي تسجيله', en: 'Withdrawn' }, value: 'withdrawn' },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: 'الإلغاء يوقف وصول الطالب إلى حصص البرنامج وموادّه، ويُبقي السجلّ.',
          en: "Withdrawing stops the student's access to the program's sessions and materials, and keeps the record.",
        },
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'student',
      label: { ar: 'سجّله', en: 'Enrolled by' },
      options: [
        { label: { ar: 'الطالب', en: 'The student' }, value: 'student' },
        { label: { ar: 'الفريق', en: 'The team' }, value: 'staff' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'agreedAt',
      type: 'date',
      label: { ar: 'وافق على الشروط في', en: 'Agreed to the terms' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => !!data?.agreedAt,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
  ],
}
