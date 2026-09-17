import type { CollectionConfig } from 'payload'
import { nobody, staffOnly } from '@/access'
import { CV_MIME_TYPES } from '@/lib/forms/apply-schema'

/**
 * CVs attached to applications. Unlike `media`, nothing here is public: the file
 * endpoint honours `read`, so a CV URL answers 403 to anyone who is not staff.
 * Files are created only by the apply server action (overrideAccess), never through
 * the REST endpoint or the admin's own upload button.
 */
export const ApplicationFiles: CollectionConfig = {
  slug: 'application-files',
  labels: {
    singular: { ar: 'ملف طلب', en: 'Application file' },
    plural: { ar: 'ملفات الطلبات', en: 'Application files' },
  },
  admin: {
    group: { ar: 'الطلبات', en: 'Submissions' },
    useAsTitle: 'originalName',
    defaultColumns: ['originalName', 'applicant', 'createdAt'],
    description: {
      ar: 'السير الذاتية المرفقة بطلبات الالتحاق. لا يطّلع عليها إلا فريق الأكاديمية.',
      en: 'CVs attached to applications. Visible to the academy’s team only.',
    },
  },
  access: { read: staffOnly, create: nobody, update: staffOnly, delete: staffOnly },
  upload: {
    staticDir: 'application-files',
    mimeTypes: [...CV_MIME_TYPES],
    crop: false,
    focalPoint: false,
    filesRequiredOnCreate: true,
  },
  fields: [
    {
      name: 'applicant',
      type: 'text',
      label: { ar: 'المتقدّم', en: 'Applicant' },
      admin: { readOnly: true },
    },
    {
      name: 'originalName',
      type: 'text',
      label: { ar: 'اسم الملف الأصلي', en: 'Original file name' },
      admin: { readOnly: true },
    },
  ],
}
