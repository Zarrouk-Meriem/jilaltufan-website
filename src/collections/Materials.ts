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
  hooks: {
    // A material made from an instructor's file is what makes that file public; deleting
    // the material closes it again (back to «بانتظار المراجعة»), so nothing stays
    // downloadable that no material links to.
    afterDelete: [
      async ({ doc, req }) => {
        const fileId =
          typeof doc.sessionFile === 'object' && doc.sessionFile
            ? doc.sessionFile.id
            : doc.sessionFile
        if (!fileId) return
        await req.payload
          .update({
            collection: 'session-files',
            id: fileId,
            data: { review: 'pending', material: null },
            overrideAccess: true,
            req,
          })
          .catch(() => {})
      },
    ],
  },
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
      // Set when staff publish an instructor's file (Instructor files → «انشره مادةً»): the
      // material points at that file where it is instead of a copy in the media library.
      name: 'sessionFile',
      type: 'upload',
      relationTo: 'session-files',
      label: { ar: 'ملف المحاضر', en: 'Instructor’s file' },
      admin: {
        readOnly: true,
        condition: (data) => data?.type === 'pdf' && !!data?.sessionFile,
      },
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
