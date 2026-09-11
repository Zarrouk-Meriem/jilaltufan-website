import type { CollectionConfig } from 'payload'

/**
 * Staff accounts only (admin | editor). Phase 2 adds separate `students` and
 * `instructors` auth collections rather than widening this one.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { ar: 'مستخدم', en: 'User' }, plural: { ar: 'المستخدمون', en: 'Users' } },
  admin: { useAsTitle: 'email', group: { ar: 'الإعدادات', en: 'Settings' } },
  auth: true,
  fields: [
    { name: 'name', type: 'text', label: { ar: 'الاسم', en: 'Name' } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: { ar: 'الدور', en: 'Role' },
      options: [
        { label: { ar: 'مدير', en: 'Admin' }, value: 'admin' },
        { label: { ar: 'محرّر', en: 'Editor' }, value: 'editor' },
      ],
    },
  ],
}
