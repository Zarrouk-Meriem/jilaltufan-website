import type { Access, CollectionConfig } from 'payload'
import { isAccount, isStaffUser, nobody, staffOnly } from '@/access'
import { CV_MIME_TYPES } from '@/lib/forms/apply-schema'

/**
 * Staff see every CV; an applicant with an account sees the one attached to their own
 * application, and nobody else sees anything.
 *
 * The rule lives here rather than in a route of our own because Payload's file endpoint
 * already honours it — which is what made a CV URL answer 403 to the public in the first
 * place. Expressing "mine" needs the file to know its application, which is why the
 * relationship below exists.
 */
const ownerOrStaff: Access = async ({ req }) => {
  if (isStaffUser(req)) return true
  if (!isAccount(req) || !req.user) return false
  const { docs } = await req.payload.find({
    collection: 'accounts',
    where: { id: { equals: req.user.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const application = docs[0]?.application
  const id = typeof application === 'object' && application ? application.id : application
  return id ? { application: { equals: id } } : false
}

/**
 * CVs attached to applications. Unlike `media`, nothing here is public: the file endpoint
 * honours `read`, so a CV URL answers 403 to anyone but staff and the applicant it belongs
 * to. Files are created only by the apply server action (overrideAccess), never through the
 * REST endpoint or the admin's own upload button.
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
  access: { read: ownerOrStaff, create: nobody, update: staffOnly, delete: staffOnly },
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
    {
      name: 'application',
      type: 'relationship',
      relationTo: 'applications',
      index: true,
      label: { ar: 'الطلب', en: 'Application' },
      admin: {
        readOnly: true,
        description: {
          ar: 'الطلب الذي أُرفق به الملف. هو ما يتيح لصاحب الطلب تنزيل سيرته من نافذته.',
          en: 'The application this file was attached to — what lets its own applicant download it from their window.',
        },
      },
    },
  ],
}
