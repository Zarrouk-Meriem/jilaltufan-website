'use server'

import { redirect } from 'next/navigation'
import type { FormState } from '../../actions'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { canEnroll, enrollmentRows } from '@/lib/enrollment/access'
import { checkEnrollment, type Track } from '@/lib/enrollment/rules'
import { getClient } from '@/lib/queries/client'

const error = (formError: string): FormState => ({ status: 'error', formError })

/**
 * A student enrolls themselves (rules in `src/lib/enrollment/rules.ts`). Everything is
 * checked again here, whatever the page showed: the dialog's checkbox, the student's
 * standing, and the rules — the `enrollments` hook checks the rules once more on write.
 * On success the student lands on their program's own page.
 */
export async function enroll(
  locale: Locale,
  slug: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  if (fd.get('agree') !== 'on') return error('mustAgree')
  if (!(await canEnroll(account))) return error('notEligible')

  const payload = await getClient()
  const found = await payload.find({
    collection: 'programs',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const program = found.docs[0]
  if (!program) return error('closed')

  const rows = await enrollmentRows(account)
  const check = checkEnrollment({
    program: {
      id: program.id,
      track: (program.track ?? 'directed') as Track,
      registrationMode: program.registrationMode,
      published: true,
    },
    existing: rows,
    by: 'student',
  })
  // Already enrolled is not an error for the person: take them to the program.
  if (!check.ok && check.reason !== 'already-enrolled')
    return error(check.reason === 'other-directed' ? 'otherDirected' : 'closed')

  if (check.ok) {
    const data = {
      state: 'enrolled' as const,
      source: 'student' as const,
      agreedAt: new Date().toISOString(),
    }
    // A row withdrawn earlier comes back rather than being duplicated (one per program).
    const earlier = rows.find((r) => r.programId === program.id)
    try {
      if (earlier)
        await payload.update({
          collection: 'enrollments',
          id: earlier.id,
          data,
          overrideAccess: true,
        })
      else
        await payload.create({
          collection: 'enrollments',
          data: { ...data, account: account.id, program: program.id },
          overrideAccess: true,
        })
    } catch (err) {
      payload.logger.error({ err, msg: 'enrollment failed', account: account.id, slug })
      return error('failed')
    }
  }
  redirect(`/${locale}/account/programs/${slug}${check.ok ? '?enrolled=1' : ''}`)
}
