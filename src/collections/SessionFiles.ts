import type { Access, CollectionConfig } from 'payload'
import { isAccount, isStaffUser, nobody, staffOnly } from '@/access'
import { SESSION_FILE_MIME_TYPES } from '@/lib/forms/session-file-schema'

/**
 * What a guest instructor sends for their session, before anyone publishes it.
 *
 * Deliberately not `media`: that collection is world-readable, so a file dropped there is
 * public the moment it lands, draft row or not. These sit here, readable only by the person
 * who sent them and by staff, until staff turn one into a `materials` row — which is the
 * review step, and the only thing that puts a file in front of students.
 */
const senderOrStaff: Access = ({ req }) => {
  if (isStaffUser(req)) return true
  if (!isAccount(req) || !req.user) return false
  return { sender: { equals: req.user.id } }
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
    defaultColumns: ['originalName', 'session', 'sender', 'createdAt'],
    description: {
      ar: 'ما يرسله المحاضرون الضيوف لحصصهم. لا يراها الطلبة إلا بعد أن ينشرها الفريق كمادة تعليمية.',
      en: 'What guest instructors send for their sessions. Students see none of it until the team publishes it as a material.',
    },
  },
  // Created only by the instructor window's own action (overrideAccess), never through the
  // REST endpoint or the admin's upload button.
  access: { read: senderOrStaff, create: nobody, update: staffOnly, delete: staffOnly },
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
  ],
}
