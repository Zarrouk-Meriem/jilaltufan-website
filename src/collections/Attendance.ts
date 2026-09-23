import type { Access, CollectionConfig } from 'payload'
import { adminOnly, isAccount, isStaffUser, staffOnly } from '@/access'

/**
 * Who was at which session (PLAN.md §13.5). One row per person per session.
 *
 * `source` is the whole discipline of this collection. Zoom's participant report is the
 * register by default — the academy runs its sessions there — but matching a meeting
 * participant to an account is imperfect by nature (a different address, a phone join, a
 * name typed by hand), so a staff mark always wins: the sync writes and updates only rows
 * it owns, and never touches one a person put there. Step 6 adds the sync; until then every
 * row is `staff`.
 */
const ownOrStaff: Access = ({ req }) => {
  if (isStaffUser(req)) return true
  if (!isAccount(req) || !req.user) return false
  return { account: { equals: req.user.id } }
}

export const Attendance: CollectionConfig = {
  slug: 'attendance',
  labels: {
    singular: { ar: 'حضور', en: 'Attendance' },
    plural: { ar: 'الحضور', en: 'Attendance' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'id',
    defaultColumns: ['session', 'account', 'state', 'source', 'updatedAt'],
    description: {
      ar: 'سجلّ الحضور: صف واحد لكل طالب في كل حصة. تُعلَّم من صفحة الحصة نفسها، ولا يغيّر التحديث التلقائي من Zoom ما علّمه الفريق بيده.',
      en: 'The register: one row per student per session. Marked from the session itself; a later sync from Zoom never overwrites what the team marked by hand.',
    },
  },
  access: { read: ownOrStaff, create: staffOnly, update: staffOnly, delete: adminOnly },
  // One row per person per session. Declared here rather than added to the database by
  // hand: `next dev` pushes the schema from this config, so an index it does not know about
  // is dropped on the next restart — and without it two people marking the same session at
  // the same moment would each create a row and quietly double that student's progress.
  indexes: [{ fields: ['session', 'account'], unique: true }],
  hooks: {
    beforeChange: [
      // A row written by a person is a person's mark, whatever the body says — that is what
      // makes it stick against a later sync. The sync itself runs server-side with
      // `overrideAccess` and no signed-in user, so it is not caught by this and keeps its
      // own `source: 'zoom'`. `recordedBy` comes from the request for the same reason: a
      // row's author is not something a form should be able to claim.
      ({ data, req }) =>
        isStaffUser(req) ? { ...data, source: 'staff', recordedBy: req.user?.id } : data,
    ],
  },
  defaultSort: '-updatedAt',
  fields: [
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
      index: true,
      label: { ar: 'الحصة', en: 'Session' },
    },
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
      index: true,
      label: { ar: 'الحساب', en: 'Account' },
    },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'present',
      index: true,
      label: { ar: 'الحالة', en: 'State' },
      options: [
        { label: { ar: 'حاضر', en: 'Present' }, value: 'present' },
        { label: { ar: 'غائب', en: 'Absent' }, value: 'absent' },
        { label: { ar: 'غياب بعذر', en: 'Excused' }, value: 'excused' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      index: true,
      label: { ar: 'المصدر', en: 'Source' },
      options: [
        { label: { ar: 'الفريق', en: 'The team' }, value: 'staff' },
        { label: { ar: 'Zoom', en: 'Zoom' }, value: 'zoom' },
      ],
      admin: {
        description: {
          ar: 'ما علّمه الفريق لا يُستبدل بتحديث لاحق من Zoom.',
          en: 'What the team marked is never replaced by a later sync from Zoom.',
        },
      },
    },
    {
      name: 'minutes',
      type: 'number',
      min: 0,
      label: { ar: 'دقائق الحضور', en: 'Minutes attended' },
      admin: {
        description: {
          ar: 'من تقرير Zoom حين يتوفّر.',
          en: 'From the Zoom report when there is one.',
        },
      },
    },
    {
      name: 'recordedBy',
      type: 'relationship',
      relationTo: 'users',
      label: { ar: 'سجّلها', en: 'Recorded by' },
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
