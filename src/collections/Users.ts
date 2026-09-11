import type { CollectionConfig } from 'payload'
import { adminOnly, selfOrAdmin } from '@/access'

/**
 * Staff accounts only (admin | editor). Phase 2 adds separate `students` and
 * `instructors` auth collections rather than widening this one.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { ar: 'مستخدم', en: 'User' }, plural: { ar: 'المستخدمون', en: 'Users' } },
  admin: { useAsTitle: 'email', group: { ar: 'الإعدادات', en: 'Settings' } },
  auth: true,
  hooks: {
    beforeChange: [
      // The very first account is always an admin; later accounts keep what an admin chose.
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
          })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  access: {
    read: selfOrAdmin,
    create: adminOnly,
    update: selfOrAdmin,
    delete: adminOnly,
    admin: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', label: { ar: 'الاسم', en: 'Name' } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      access: { update: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin' },
      label: { ar: 'الدور', en: 'Role' },
      options: [
        { label: { ar: 'مدير', en: 'Admin' }, value: 'admin' },
        { label: { ar: 'محرّر', en: 'Editor' }, value: 'editor' },
      ],
    },
  ],
}
