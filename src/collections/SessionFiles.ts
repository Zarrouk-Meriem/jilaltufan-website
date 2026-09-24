import type { Access, CollectionConfig } from 'payload'
import { isAccount, isStaffUser, nobody, staffOnly } from '@/access'
import { SESSION_FILE_MIME_TYPES } from '@/lib/forms/session-file-schema'
import { publishAsMaterial } from './hooks/publish-session-file'

/**
 * What a guest instructor sends for their session, before anyone publishes it.
 *
 * Deliberately not `media`: that collection is world-readable, so a file dropped there is
 * public the moment it lands, draft row or not. These sit here, readable only by the person
 * who sent them and by staff, until staff turn one into a `materials` row — which is the
 * review step, and the only thing that puts a file in front of students.
 */
/**
 * Staff read everything; the sender reads their own; anyone reads a file once staff have
 * published it as a material — the material points at the file where it is, so publishing
 * is what opens it (2026-09-24: no second copy in `media`, and nothing in between).
 */
const senderStaffOrPublished: Access = ({ req }) => {
  if (isStaffUser(req)) return true
  const published = { review: { equals: 'published' } }
  if (!isAccount(req) || !req.user) return published
  return { or: [{ sender: { equals: req.user.id } }, published] }
}

export const SessionFiles: CollectionConfig = {
  slug: 'session-files',
  labels: {
    singular: { ar: 'ملف حصة', en: 'Session file' },
    plural: { ar: 'ملفات المحاضرين', en: 'Instructor files' },
  },
  admin: {
    group: { ar: 'الطلبات', en: 'Submissions' },
    useAsTitle: 'originalName',
    defaultColumns: ['originalName', 'session', 'sender', 'review', 'createdAt'],
    description: {
      ar: 'ما يرسله المحاضرون الضيوف لحصصهم. لا يراها الطلبة إلا بعد أن ينشرها الفريق كمادة تعليمية.',
      en: 'What guest instructors send for their sessions. Students see none of it until the team publishes it as a material.',
    },
  },
  // Created only by the instructor window's own action (overrideAccess), never through the
  // REST endpoint or the admin's upload button.
  access: { read: senderStaffOrPublished, create: nobody, update: staffOnly, delete: staffOnly },
  hooks: { afterChange: [publishAsMaterial] },
  upload: {
    staticDir: 'session-files',
    mimeTypes: [...SESSION_FILE_MIME_TYPES],
    crop: false,
    focalPoint: false,
    filesRequiredOnCreate: true,
  },
  fields: [
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      index: true,
      label: { ar: 'الحصة', en: 'Session' },
      admin: { readOnly: true },
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'accounts',
      index: true,
      label: { ar: 'المرسِل', en: 'Sent by' },
      admin: { readOnly: true },
    },
    {
      name: 'originalName',
      type: 'text',
      label: { ar: 'اسم الملف الأصلي', en: 'Original file name' },
      admin: { readOnly: true },
    },
    {
      name: 'note',
      type: 'textarea',
      maxLength: 500,
      label: { ar: 'ملاحظة المحاضر', en: 'Instructor’s note' },
      admin: { readOnly: true },
    },
    {
      name: 'review',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      label: { ar: 'المراجعة', en: 'Review' },
      options: [
        { label: { ar: 'بانتظار المراجعة', en: 'Awaiting review' }, value: 'pending' },
        { label: { ar: 'نُشر', en: 'Published' }, value: 'published' },
        { label: { ar: 'لم يُنشر', en: 'Not published' }, value: 'declined' },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: 'يراها المحاضر في نافذته. «نُشر» تضعها خانة النشر أدناه؛ «لم يُنشر» لملف لن يُنشر.',
          en: 'The instructor sees this in their window. «Published» is set by the box below; «Not published» is for a file that will not be.',
        },
      },
    },
    {
      name: 'publish',
      type: 'checkbox',
      defaultValue: false,
      label: { ar: 'انشره مادةً للطلبة', en: 'Publish it as a material' },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.mimeType === 'application/pdf' && !data?.material,
        description: {
          ar: 'فعّلها واحفظ: تُنشأ مادة منشورة لبرنامج هذه الحصة وحصتها، باسم الملف (عدّل العنوان من المادة إن أردت). يُنشر ملف PDF وحده بخطوة واحدة؛ حوّل ملف Word أو PowerPoint إلى PDF أولًا.',
          en: 'Tick and save: a published material is created for this session and its program, named after the file (edit the title on the material if you like). Only a PDF publishes in one step; convert a Word or PowerPoint file to PDF first.',
        },
      },
    },
    {
      name: 'material',
      type: 'relationship',
      relationTo: 'materials',
      label: { ar: 'المادة المنشورة', en: 'Published material' },
      admin: { position: 'sidebar', readOnly: true, condition: (data) => !!data?.material },
    },
  ],
}
