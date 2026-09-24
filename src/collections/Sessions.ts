import type { CollectionConfig } from 'payload'
import { isStaffUser, publishedOrStaff, staffFieldOnly, staffOnly } from '@/access'
import { ZoomError } from '@/lib/zoom/client'
import { syncSessionAttendance } from '@/lib/zoom/sync'
import {
  isPlaceholderField,
  localizedRichText,
  localizedText,
  localizedTextarea,
  statusField,
} from '@/fields'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  labels: {
    singular: { ar: 'حصة', en: 'Session' },
    plural: { ar: 'الحصص المباشرة', en: 'Live sessions' },
  },
  admin: {
    group: { ar: 'البرامج', en: 'Programs' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'program', 'number', 'startsAt', 'sessionStatus', 'status'],
    listSearchableFields: ['title'],
    description: {
      ar: 'كل حصة مباشرة على Zoom. يظهر رابط الانضمام للزوار حسب سياسة الروابط في إعدادات الموقع.',
      en: 'Every session is live on Zoom. The join link appears to visitors according to the join-link policy in Site Settings.',
    },
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: 'startsAt',
  endpoints: [
    {
      path: '/:id/sync-attendance',
      method: 'post',
      /**
       * Pull the register from Zoom for one session. Staff only — the roster's button is
       * the only caller, and it runs from the admin with the staff cookie.
       */
      handler: async (req) => {
        if (!isStaffUser(req)) return Response.json({ message: 'Forbidden' }, { status: 403 })
        const id = Number(req.routeParams?.id)
        if (!Number.isFinite(id)) return Response.json({ message: 'Bad id' }, { status: 400 })
        try {
          const result = await syncSessionAttendance(req.payload, id)
          return Response.json(result)
        } catch (err) {
          const reason = err instanceof ZoomError ? err.reason : 'http'
          req.payload.logger.error({ msg: 'zoom attendance sync failed', session: id, err })
          return Response.json(
            { reason, message: err instanceof Error ? err.message : 'Sync failed' },
            { status: reason === 'unconfigured' ? 501 : 502 },
          )
        }
      },
    },
  ],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'program',
          type: 'relationship',
          relationTo: 'programs',
          required: true,
          label: { ar: 'البرنامج', en: 'Program' },
          admin: { width: '60%' },
        },
        {
          name: 'number',
          type: 'number',
          required: true,
          min: 1,
          max: 24,
          label: { ar: 'رقم الحصة', en: 'Session number' },
          admin: { width: '40%' },
        },
      ],
    },
    localizedText('title', { ar: 'عنوان الحصة', en: 'Session title' }, { required: true }),
    localizedTextarea('summary', { ar: 'ملخّص', en: 'Summary' }, { maxLength: 400 }),
    localizedRichText('details', { ar: 'تفاصيل الحصة', en: 'Session details' }),
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'instructors',
      hasMany: true,
      label: { ar: 'المحاضرون', en: 'Instructors' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          required: true,
          index: true,
          label: { ar: 'موعد البداية', en: 'Starts at' },
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy HH:mm' },
            description: {
              ar: 'يُحفظ بالتوقيت العالمي ويُعرض للزوار بتوقيت القدس وبتوقيتهم المحلي.',
              en: 'Stored in UTC; shown to visitors in Al-Quds time and their local time.',
            },
            width: '50%',
          },
        },
        {
          name: 'durationMinutes',
          type: 'number',
          defaultValue: 90,
          min: 15,
          max: 480,
          label: { ar: 'المدة (دقائق)', en: 'Duration (minutes)' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: { ar: 'Zoom', en: 'Zoom' },
      fields: [
        {
          name: 'zoomJoinUrl',
          type: 'text',
          label: { ar: 'رابط الانضمام', en: 'Join URL' },
          validate: (v: unknown) =>
            !v ||
            /^https:\/\/[^\s]+zoom\.us\//.test(String(v)) ||
            'يجب أن يكون رابط Zoom يبدأ بـ https://',
          admin: {
            description: {
              ar: 'يظهر للزوار فقط ضمن نافذة الانضمام (أو حسب السياسة).',
              en: 'Visible to visitors only inside the join window (or per policy).',
            },
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'zoomMeetingId',
              type: 'text',
              label: { ar: 'معرّف الاجتماع', en: 'Meeting ID' },
            },
            {
              name: 'zoomPasscode',
              type: 'text',
              label: { ar: 'رمز الدخول', en: 'Passcode' },
              access: { read: staffFieldOnly },
              admin: {
                description: {
                  ar: 'للفريق فقط — لا يُعرض للزوار أبدًا.',
                  en: 'Staff only — never rendered publicly.',
                },
              },
            },
          ],
        },
      ],
    },
    localizedTextarea('materialsNote', { ar: 'ملاحظة عن المواد', en: 'Materials note' }),
    {
      name: 'attendance',
      type: 'ui',
      label: { ar: 'الحضور', en: 'Attendance' },
      admin: {
        components: { Field: '@/components/admin/SessionAttendance#SessionAttendanceField' },
      },
    },
    {
      name: 'sessionStatus',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      label: { ar: 'حالة الحصة', en: 'Session state' },
      options: [
        { label: { ar: 'مجدولة', en: 'Scheduled' }, value: 'scheduled' },
        { label: { ar: 'ألغيت', en: 'Cancelled' }, value: 'cancelled' },
        { label: { ar: 'انتهت', en: 'Completed' }, value: 'completed' },
      ],
      admin: { position: 'sidebar' },
    },
    statusField(),
    isPlaceholderField(),
  ],
}
