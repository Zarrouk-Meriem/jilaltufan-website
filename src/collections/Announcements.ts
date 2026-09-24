import type { CollectionConfig } from 'payload'
import { staffOnly } from '@/access'
import { localizedRichText, localizedText, statusField } from '@/fields'

/**
 * What staff tell the students of a program (user decision, 2026-09-24): a title, a body,
 * and the program it is for — or no program, to reach every enrolled student.
 *
 * Not public: the REST read is staff-only, and the student window reads them through the
 * query layer with the same gate as the rest of a program (`src/lib/enrollment/access.ts`:
 * an active account, an accepted application, an `enrolled` row).
 */
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: {
    singular: { ar: 'إعلان', en: 'Announcement' },
    plural: { ar: 'الإعلانات', en: 'Announcements' },
  },
  admin: {
    group: { ar: 'الأكاديمية', en: 'Academy' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'program', 'publishedAt', 'status'],
    description: {
      ar: 'إعلانات لطلبة البرامج، تظهر في صفحة البرنامج داخل نافذة الطالب. اترك البرنامج فارغًا ليصل الإعلان إلى كل الطلبة المسجّلين.',
      en: "Announcements for the students of a program, shown on the program's page in the student window. Leave the program empty to reach every enrolled student.",
    },
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: '-publishedAt',
  fields: [
    localizedText('title', { ar: 'العنوان', en: 'Title' }, { required: true }),
    localizedRichText('body', { ar: 'النص', en: 'Body' }, { required: true }),
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      index: true,
      label: { ar: 'البرنامج', en: 'Program' },
      filterOptions: { track: { in: ['open', 'directed'] } },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'فارغ يعني: لكل الطلبة المسجّلين في أي برنامج.',
          en: 'Empty means: every student enrolled in any program.',
        },
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      label: { ar: 'تاريخ النشر', en: 'Published' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    statusField(),
  ],
}
