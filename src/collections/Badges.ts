import type { Access, CollectionConfig } from 'payload'
import { adminOnly, isAccount, isStaffUser, staffOnly } from '@/access'
import { localizedText, localizedTextarea, statusField } from '@/fields'
import { BADGE_ICONS } from '@/lib/badges/icons'

/**
 * The badges the academy gives (user decision, 2026-09-24): staff define each one — its
 * name, what it recognises, an icon from the site's set — and how it is earned: by hand, or
 * automatically on a rule the site can check (`src/lib/badges/earned.ts`). Only published
 * badges are shown to students, earned ones in full and the rest greyed with how to earn
 * them. Not public over REST; the window reads them through the query layer.
 */
export const Badges: CollectionConfig = {
  slug: 'badges',
  labels: {
    singular: { ar: 'وسام', en: 'Badge' },
    plural: { ar: 'الأوسمة', en: 'Badges' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'name',
    defaultColumns: ['name', 'rule', 'threshold', 'status'],
    description: {
      ar: 'الأوسمة التي تمنحها الأكاديمية. يُمنح الوسام يدويًا (مجموعة «الأوسمة الممنوحة»)، أو تلقائيًا حين يحقّق الطالب قاعدته. لا يظهر للطلبة إلا المنشور.',
      en: 'The badges the Academy gives. A badge is awarded by hand (see «Badge awards») or automatically when a student meets its rule. Students see published badges only.',
    },
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminOnly },
  hooks: {
    // An award requires its badge (NOT NULL): deleting a badge takes it back from everyone.
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'badge-awards',
          where: { badge: { equals: id } },
          overrideAccess: true,
          req,
        })
      },
    ],
  },
  defaultSort: 'order',
  fields: [
    localizedText('name', { ar: 'الاسم', en: 'Name' }, { required: true }),
    localizedTextarea(
      'description',
      { ar: 'ما يكرّمه', en: 'What it recognises' },
      { required: true, maxLength: 200 },
    ),
    {
      name: 'rule',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      label: { ar: 'طريقة المنح', en: 'How it is earned' },
      options: [
        { label: { ar: 'يدويًا من الفريق', en: 'Awarded by staff' }, value: 'manual' },
        {
          label: {
            ar: 'تلقائيًا: حضور عدد من الحصص',
            en: 'Automatic: attend a number of sessions',
          },
          value: 'sessions',
        },
        {
          label: {
            ar: 'تلقائيًا: التخرّج في برنامج موجّه',
            en: 'Automatic: graduate from a directed program',
          },
          value: 'graduated',
        },
        {
          label: { ar: 'تلقائيًا: الحصول على شهادة', en: 'Automatic: receive a certificate' },
          value: 'certificate',
        },
      ],
    },
    {
      name: 'threshold',
      type: 'number',
      min: 1,
      label: { ar: 'عدد الحصص', en: 'Number of sessions' },
      admin: {
        condition: (data) => data?.rule === 'sessions',
        description: {
          ar: 'يُمنح عند حضور هذا العدد من الحصص في أي برنامج. فارغ = لا يُمنح.',
          en: 'Awarded after attending this many sessions in any program. Empty = never awarded.',
        },
      },
    },
    {
      name: 'icon',
      type: 'select',
      required: true,
      defaultValue: 'award',
      label: { ar: 'الأيقونة', en: 'Icon' },
      options: BADGE_ICONS.map((i) => ({ label: i, value: i })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: { ar: 'الترتيب', en: 'Order' },
      admin: { position: 'sidebar' },
    },
    statusField(),
  ],
}

const ownOrStaff: Access = ({ req }) => {
  if (isStaffUser(req)) return true
  if (!isAccount(req) || !req.user) return false
  return { account: { equals: req.user.id } }
}

/** Who holds which badge: one row per student per badge, given by the rule or by staff. */
export const BadgeAwards: CollectionConfig = {
  slug: 'badge-awards',
  labels: {
    singular: { ar: 'وسام ممنوح', en: 'Badge award' },
    plural: { ar: 'الأوسمة الممنوحة', en: 'Badge awards' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'id',
    defaultColumns: ['account', 'badge', 'source', 'awardedAt'],
    description: {
      ar: 'لمنح وسام يدويًا: أضف صفًا باسم الطالب والوسام. الأوسمة التلقائية تُضاف هنا وحدها. حذف الصف يسحب الوسام.',
      en: 'To award a badge by hand, add a row with the student and the badge. Automatic badges are added here by themselves. Deleting a row takes the badge back.',
    },
  },
  access: { read: ownOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  indexes: [{ fields: ['account', 'badge'], unique: true }],
  hooks: {
    beforeChange: [
      // Who gave it is taken from the request: a person here is staff by definition.
      ({ data, req }) => (isStaffUser(req) ? { ...data, source: 'staff' } : data),
    ],
  },
  defaultSort: '-awardedAt',
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
      name: 'badge',
      type: 'relationship',
      relationTo: 'badges',
      required: true,
      index: true,
      label: { ar: 'الوسام', en: 'Badge' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'rule',
      label: { ar: 'مُنح', en: 'Given' },
      options: [
        { label: { ar: 'تلقائيًا', en: 'Automatically' }, value: 'rule' },
        { label: { ar: 'من الفريق', en: 'By staff' }, value: 'staff' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'awardedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: { ar: 'تاريخ المنح', en: 'Awarded on' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' },
      },
    },
  ],
}
