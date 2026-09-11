import type { CollectionConfig } from 'payload'
import { nobody, staffOnly } from '@/access'

/** Same posture as Applications: created only via the contact server action. */
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: {
    singular: { ar: 'رسالة', en: 'Message' },
    plural: { ar: 'رسائل التواصل', en: 'Contact messages' },
  },
  admin: {
    group: { ar: 'الطلبات', en: 'Submissions' },
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'name', 'email', 'messageStatus', 'createdAt'],
  },
  access: { read: staffOnly, create: nobody, update: staffOnly, delete: staffOnly },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, label: { ar: 'الاسم', en: 'Name' } },
        {
          name: 'email',
          type: 'email',
          required: true,
          label: { ar: 'البريد الإلكتروني', en: 'Email' },
        },
      ],
    },
    { name: 'subject', type: 'text', required: true, label: { ar: 'الموضوع', en: 'Subject' } },
    { name: 'message', type: 'textarea', required: true, label: { ar: 'الرسالة', en: 'Message' } },
    {
      name: 'messageStatus',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: { ar: 'الحالة', en: 'Status' },
      admin: { position: 'sidebar' },
      options: [
        { label: { ar: 'جديدة', en: 'New' }, value: 'new' },
        { label: { ar: 'تم الردّ', en: 'Replied' }, value: 'replied' },
        { label: { ar: 'مؤرشفة', en: 'Archived' }, value: 'archived' },
      ],
    },
    {
      name: 'locale',
      type: 'select',
      options: [
        { label: 'العربية', value: 'ar' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
