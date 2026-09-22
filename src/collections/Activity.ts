import type { CollectionConfig, GlobalConfig } from 'payload'
import { adminOnly, nobody } from '@/access'
import { ACTIVITY_SLUG, targetOptions } from '@/lib/payload/activity'

/**
 * The «Activity log» page: who changed what, when, across every collection and global.
 * Rows are written only by the hooks in `src/lib/payload/activity.ts`; nobody can create,
 * edit, or delete one from the admin, and only admins can read it (editors do not see it
 * in the sidebar either). The list view is the page: sort, filter by editor, action, or
 * collection, and search by document title or email.
 */
export const Activity = (
  collections: CollectionConfig[],
  globals: GlobalConfig[],
): CollectionConfig => ({
  slug: ACTIVITY_SLUG,
  labels: {
    singular: { ar: 'نشاط', en: 'Activity' },
    plural: { ar: 'سجلّ النشاط', en: 'Activity log' },
  },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    useAsTitle: 'title',
    defaultColumns: ['createdAt', 'userEmail', 'action', 'target', 'title', 'changes'],
    listSearchableFields: ['title', 'userEmail', 'docId'],
    pagination: { defaultLimit: 50 },
    hidden: ({ user }) => user?.role !== 'admin',
    description: {
      ar: 'كل إنشاء أو تعديل أو حذف قام به أحد أعضاء الفريق، بالوقت والحساب والحقول التي تغيّرت. السجل للقراءة فقط.',
      en: 'Every create, update, and delete made by a staff account, with the time, the account, and the fields that changed. Read-only.',
    },
  },
  access: { read: adminOnly, create: nobody, update: nobody, delete: nobody },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'createdAt',
      type: 'date',
      label: { ar: 'الوقت', en: 'Time' },
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        components: { Cell: '@/components/admin/ActivityCells#TimeCell' },
      },
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      index: true,
      label: { ar: 'الإجراء', en: 'Action' },
      options: [
        { value: 'create', label: { ar: 'إنشاء', en: 'Create' } },
        { value: 'update', label: { ar: 'تعديل', en: 'Update' } },
        { value: 'delete', label: { ar: 'حذف', en: 'Delete' } },
      ],
    },
    {
      name: 'target',
      type: 'select',
      required: true,
      index: true,
      label: { ar: 'القسم', en: 'Collection' },
      options: targetOptions(collections, globals),
    },
    {
      name: 'title',
      type: 'text',
      label: { ar: 'المستند', en: 'Document' },
      admin: { components: { Cell: '@/components/admin/ActivityCells#DocumentCell' } },
    },
    { name: 'docId', type: 'text', index: true, label: { ar: 'المعرّف', en: 'Document ID' } },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: { ar: 'الحساب', en: 'Account' },
    },
    {
      name: 'userEmail',
      type: 'text',
      index: true,
      label: { ar: 'المحرّر', en: 'Editor' },
      admin: {
        description: {
          ar: 'نسخة من البريد وقت الإجراء، فتبقى ولو حُذف الحساب لاحقًا.',
          en: 'The email at the time of the action; kept even if the account is deleted later.',
        },
      },
    },
    { name: 'locale', type: 'text', label: { ar: 'اللغة', en: 'Locale' } },
    {
      name: 'changes',
      type: 'json',
      label: { ar: 'التغييرات', en: 'Changes' },
      admin: {
        components: {
          Cell: '@/components/admin/ActivityCells#ChangesCell',
          Field: '@/components/admin/ActivityCells#ChangesField',
        },
      },
    },
  ],
})
