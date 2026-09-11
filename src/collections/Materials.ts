import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staffOnly } from '@/access'
import { isPlaceholderField, localizedText, localizedTextarea, statusField } from '@/fields'

export const Materials: CollectionConfig = {
  slug: 'materials',
  labels: {
    singular: { ar: 'مادة تعليمية', en: 'Material' },
    plural: { ar: 'المحاضرات والمواد', en: 'Lectures & materials' },
  },
  admin: {
    group: { ar: 'المعرفة', en: 'Knowledge' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'program', 'status'],
    description: {
      ar: 'ملفات PDF وروابط وقراءات مرتبطة ببرنامج أو حصة.',
      en: 'PDFs, links, and readings tied to a program or session.',
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    localizedText('title', { ar: 'العنوان', en: 'Title' }, { required: true }),
    {
      type: 'row',
      fields: [
        {
          name: 'program',
          type: 'relationship',
          relationTo: 'programs',
          label: { ar: 'البرنامج', en: 'Program' },
        },
        {
          name: 'session',
          type: 'relationship',
          relationTo: 'sessions',
          label: { ar: 'الحصة', en: 'Session' },
        },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'pdf',
      label: { ar: 'النوع', en: 'Type' },
      options: [
        { label: { ar: 'ملف PDF', en: 'PDF' }, value: 'pdf' },
        { label: { ar: 'رابط', en: 'Link' }, value: 'link' },
        { label: { ar: 'قراءة', en: 'Reading' }, value: 'reading' },
      ],
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: { ar: 'الملف', en: 'File' },
      admin: { condition: (data) => data?.type === 'pdf' },
    },
    {
      name: 'url',
      type: 'text',
      label: { ar: 'الرابط', en: 'URL' },
      admin: { condition: (data) => data?.type !== 'pdf' },
    },
    localizedTextarea('description', { ar: 'الوصف', en: 'Description' }),
    statusField(),
    isPlaceholderField(),
  ],
}
