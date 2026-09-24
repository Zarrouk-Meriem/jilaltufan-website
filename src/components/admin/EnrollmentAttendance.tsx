import type { UIFieldServerProps } from 'payload'
import React from 'react'
import { getAccountProgress } from '@/lib/queries/account'
import type { Account } from '@/payload-types'

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? Number((v as { id: unknown }).id)
      : null

/**
 * Beside «تخرّج» on an enrollment: the student's attendance in this program against the
 * share the academy requires (Site settings → Certificates). A check for the person ticking
 * the box, not a rule — the panel's decision stands either way.
 */
export async function EnrollmentAttendanceField({ data, i18n, payload }: UIFieldServerProps) {
  const ar = i18n.language === 'ar'
  const accountId = idOf(data?.account)
  const programId = idOf(data?.program)
  const wrap = (body: React.ReactNode) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '0.5rem' }}>{ar ? 'الحضور' : 'Attendance'}</h4>
      {body}
    </div>
  )
  if (!accountId || !programId)
    return wrap(
      <p className="field-description">
        {ar ? 'اختر الطالب والبرنامج أولًا.' : 'Choose the student and the program first.'}
      </p>,
    )

  const [program, settings, progress] = await Promise.all([
    payload.findByID({ collection: 'programs', id: programId, depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }),
    getAccountProgress({ id: accountId } as Account, {
      id: programId,
      title: '',
      slug: '',
      track: 'directed',
    }),
  ])
  const open = program.track === 'open'
  const share = open ? settings.attendanceCertificateShare : settings.graduationAttendanceShare
  if (!progress)
    return wrap(
      <p className="field-description">
        {ar ? 'لا حصص منشورة لهذا البرنامج بعد.' : 'This program has no published sessions yet.'}
      </p>,
    )

  const pct = Math.round((progress.attended / progress.total) * 100)
  const line = ar
    ? `حضر ${progress.attended} من ${progress.total} حصة (${pct}٪)${progress.excused ? `، وغاب بعذر عن ${progress.excused}` : ''}.`
    : `Attended ${progress.attended} of ${progress.total} sessions (${pct}%)${progress.excused ? `, excused from ${progress.excused}` : ''}.`
  const check =
    share == null
      ? ar
        ? 'لم تُحدَّد النسبة المطلوبة بعد (الإعدادات ← الشهادات).'
        : 'No required share is set yet (Site settings → Certificates).'
      : pct >= share
        ? ar
          ? `✓ يبلغ النسبة المطلوبة (${share}٪).`
          : `✓ Meets the required share (${share}%).`
        : ar
          ? `دون النسبة المطلوبة (${share}٪).`
          : `Below the required share (${share}%).`
  return wrap(
    <>
      <p style={{ margin: 0 }}>{line}</p>
      <p className="field-description" style={{ marginTop: '0.25rem' }}>
        {check}
      </p>
    </>,
  )
}
