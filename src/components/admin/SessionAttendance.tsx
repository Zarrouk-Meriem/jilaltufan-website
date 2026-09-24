import type { UIFieldServerProps } from 'payload'
import React from 'react'
import { programRoster } from '@/lib/enrollment/access'
import {
  SessionAttendanceRoster,
  type RosterRow,
  type RosterStrings,
} from './SessionAttendanceClient'

/**
 * The register for one session, on the session's own page — where staff will be when they
 * come to mark it, rather than one row at a time in a collection nobody wants to page
 * through (PLAN.md §13.5).
 *
 * Server half: the roster is the students of this session's program, with whatever has
 * already been marked. A session with no program yet has no roster, and says so.
 */
export async function SessionAttendanceField({ data, i18n, payload }: UIFieldServerProps) {
  const ar = i18n.language === 'ar'
  const t: RosterStrings = ar
    ? {
        present: 'حاضر',
        absent: 'غائب',
        excused: 'بعذر',
        save: 'احفظ الحضور',
        saving: 'يُحفظ…',
        saved: 'حُفظ الحضور.',
        failed: 'تعذّر الحفظ. حاول مرّة أخرى.',
        fromZoom: 'من Zoom',
        unmarked: 'لم يُعلَّم',
        count: '{marked} من {total} حاضرون',
        sync: {
          pull: 'اسحب الحضور من Zoom',
          pulling: 'يُسحب…',
          done: 'سُجّل {marked}، وبقي {kept} كما علّمه الفريق.',
          unmatched: 'لم نتعرّف على: {people}. علّمهم بيدك إن كانوا من الطلبة.',
          unconfigured: 'لم يُربط Zoom بعد. أضف بيانات التطبيق في إعدادات الخادم.',
          noReport: 'خطة Zoom الحالية لا تتيح تقارير الحضور.',
          notFound: 'لا سجلّ لهذا الاجتماع في Zoom بعد. التقرير يتوفّر بعد انتهاء الحصة.',
          failed: 'تعذّر السحب. حاول مرّة أخرى.',
        },
      }
    : {
        present: 'Present',
        absent: 'Absent',
        excused: 'Excused',
        save: 'Save attendance',
        saving: 'Saving…',
        saved: 'Attendance saved.',
        failed: 'That could not be saved. Try again.',
        fromZoom: 'From Zoom',
        unmarked: 'Not marked',
        count: '{marked} of {total} present',
        sync: {
          pull: 'Pull attendance from Zoom',
          pulling: 'Pulling…',
          done: 'Recorded {marked}; {kept} left as the team marked them.',
          unmatched: 'Not recognised: {people}. Mark them by hand if they are students.',
          unconfigured:
            'Zoom is not connected yet. Add the app’s credentials to the server settings.',
          noReport: 'This Zoom plan does not include attendance reports.',
          notFound:
            'Zoom has no record of this meeting yet. The report appears after the session ends.',
          failed: 'That could not be pulled. Try again.',
        },
      }

  const sessionId = typeof data?.id === 'number' ? data.id : null
  const programId =
    typeof data?.program === 'number'
      ? data.program
      : typeof data?.program === 'object' && data?.program
        ? (data.program as { id: number }).id
        : null

  const wrap = (body: React.ReactNode) => (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>{ar ? 'الحضور' : 'Attendance'}</h4>
      {body}
    </div>
  )

  if (!sessionId)
    return wrap(
      <p className="field-description">
        {ar ? 'احفظ الحصة أولًا، ثم علّم الحضور.' : 'Save the session first, then mark attendance.'}
      </p>,
    )
  if (!programId)
    return wrap(
      <p className="field-description">
        {ar
          ? 'لا برنامج لهذه الحصة بعد، فلا قائمة طلبة لها.'
          : 'This session has no program yet, so it has no roster.'}
      </p>,
    )

  // The students of this program by the one access rule (enrolled, accepted, account
  // active) — the same list the student window and the Zoom sync use.
  const [students, marked] = await Promise.all([
    programRoster(payload, programId),
    payload.find({
      collection: 'attendance',
      where: { session: { equals: sessionId } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const bySource = new Map(
    marked.docs.map((d) => [
      typeof d.account === 'number' ? d.account : (d.account as { id: number })?.id,
      d,
    ]),
  )

  const rows: RosterRow[] = students.map((a) => {
    const row = bySource.get(a.id)
    return {
      accountId: a.id,
      name: a.name || a.email,
      state: (row?.state as RosterRow['state']) ?? null,
      source: (row?.source as RosterRow['source']) ?? null,
      rowId: row?.id ?? null,
    }
  })

  if (rows.length === 0)
    return wrap(
      <p className="field-description">
        {ar ? 'لا طلبة مسجّلين في هذا البرنامج بعد.' : 'No students enrolled in this program yet.'}
      </p>,
    )

  // A `ui` field's own label is not rendered, so the block says what it is.
  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>{ar ? 'الحضور' : 'Attendance'}</h4>
      <p className="field-description" style={{ marginTop: 0 }}>
        {ar
          ? 'علّم الحضور بعد انتهاء الحصة. ما تعلّمه هنا يبقى ولا يستبدله تحديث لاحق من Zoom.'
          : 'Mark the register after the session. What you mark here stays, and a later sync from Zoom does not replace it.'}
      </p>
      <SessionAttendanceRoster
        sessionId={sessionId}
        rows={rows}
        t={t}
        canSync={!!data?.zoomMeetingId}
      />
    </div>
  )
}
