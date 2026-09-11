/**
 * Idempotent seed — safe to re-run. Upserts by slug; never overwrites a record
 * an editor has since marked isPlaceholder: false.
 *   pnpm seed
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload, type Payload, type Where } from 'payload'
import type { AboutPage } from '@/payload-types'

type RichText = NonNullable<AboutPage['intro']>
import { MISSION, PILLARS, PLACEHOLDER, PROGRAMS, SEASON, SEASON_MONTHS } from './data'

type Locale = 'ar' | 'en'

/** Minimal Lexical document with one paragraph. */
const paragraph = (text: string): RichText =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          textFormat: 0,
          textStyle: '',
          children: [
            { type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 },
          ],
        },
      ],
    },
  }) as unknown as RichText

/** 16:00 Asia/Hebron on the 15th of the given month, as a UTC ISO string. */
function placeholderStart(year: number, month0: number) {
  // Palestine is UTC+3 in Sep/Oct and Apr (DST), UTC+2 Nov–Mar; these are placeholder dates anyway.
  const dst = month0 === 8 || month0 === 9 || month0 === 3
  return new Date(Date.UTC(year, month0, 15, 16 - (dst ? 3 : 2), 0)).toISOString()
}

async function upsert<T extends { id: number | string; isPlaceholder?: boolean | null }>(
  payload: Payload,
  collection: 'programs' | 'sessions' | 'instructors' | 'events',
  where: Where,
  data: Record<string, unknown>,
  translations: Partial<Record<Locale, Record<string, unknown>>>,
): Promise<T> {
  const existing = await payload.find({
    collection,
    where,
    limit: 1,
    locale: 'ar',
    overrideAccess: true,
  })
  const found = existing.docs[0] as T | undefined
  if (found && found.isPlaceholder === false) {
    payload.logger.info(`skip ${collection} (editor-owned): ${JSON.stringify(where)}`)
    return found
  }
  const base = { ...data, ...(translations.ar ?? {}), isPlaceholder: true }
  const doc = found
    ? await payload.update({
        collection,
        id: found.id,
        data: base,
        locale: 'ar',
        overrideAccess: true,
      })
    : await payload.create({ collection, data: base as never, locale: 'ar', overrideAccess: true })
  if (translations.en) {
    await payload.update({
      collection,
      id: doc.id,
      data: translations.en,
      locale: 'en',
      overrideAccess: true,
    })
  }
  return doc as unknown as T
}

async function seed() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[seed] ${m}`)

  // ── Instructor placeholder (no photo, no biography — nothing invented) ──
  const instructor = await upsert(
    payload,
    'instructors',
    { slug: { equals: 'placeholder-instructor' } },
    { slug: 'placeholder-instructor', status: 'draft' },
    {
      ar: { name: '[اسم المحاضر]', role: '[الصفة]', shortBio: PLACEHOLDER.ar },
      en: { name: '[Instructor name]', role: '[Role]', shortBio: PLACEHOLDER.en },
    },
  )
  log(`instructor ${instructor.id}`)

  // ── Programs + 8 sessions each ──
  for (const p of PROGRAMS) {
    const program = await upsert(
      payload,
      'programs',
      { slug: { equals: p.slug } },
      {
        slug: p.slug,
        track: p.track,
        order: p.order,
        featured: p.featured ?? false,
        status: 'published',
        registrationMode: 'application',
        seasonStartMonth: 'sep',
        seasonEndMonth: 'apr',
        sessionsCount: 8,
        goals: [1, 2, 3].map(() => ({ text: PLACEHOLDER.ar })),
      },
      {
        ar: {
          title: p.title.ar,
          shortDescription: PLACEHOLDER.ar,
          intro: paragraph(PLACEHOLDER.ar),
          targetAudience: paragraph(PLACEHOLDER.ar),
          durationSummary: '8 حصص — حصة واحدة شهريًا من سبتمبر إلى أبريل',
          registrationNote: paragraph(PLACEHOLDER.ar),
        },
        en: {
          title: p.title.en,
          shortDescription: PLACEHOLDER.en,
          intro: paragraph(PLACEHOLDER.en),
          targetAudience: paragraph(PLACEHOLDER.en),
          durationSummary: '8 sessions — one per month, September to April',
          registrationNote: paragraph(PLACEHOLDER.en),
          goals: [1, 2, 3].map(() => ({ text: PLACEHOLDER.en })),
        },
      },
    )
    log(`program ${p.slug} → ${program.id}`)

    for (let i = 0; i < SEASON_MONTHS.length; i++) {
      const mo = SEASON_MONTHS[i]!
      const number = i + 1
      await upsert(
        payload,
        'sessions',
        { and: [{ program: { equals: program.id } }, { number: { equals: number } }] },
        {
          program: program.id,
          number,
          startsAt: placeholderStart(mo.y, mo.m),
          durationMinutes: 90,
          sessionStatus: 'scheduled',
          status: 'published',
        },
        {
          ar: { title: `[الحصة ${mo.ar}]`, summary: PLACEHOLDER.ar },
          en: { title: `[Session ${number} — ${mo.en}]`, summary: PLACEHOLDER.en },
        },
      )
    }
    log(`  8 sessions for ${p.slug}`)
  }

  // ── The Camp (dates unknown → placeholder in the season summer; flagged) ──
  await upsert(
    payload,
    'events',
    { slug: { equals: 'jeel-altoufan-camp' } },
    {
      slug: 'jeel-altoufan-camp',
      type: 'camp',
      status: 'published',
      isOnline: false,
      registrationMode: 'none',
      startDate: new Date(Date.UTC(SEASON.endYear, 6, 1, 6)).toISOString(),
      endDate: new Date(Date.UTC(SEASON.endYear, 6, 7, 18)).toISOString(),
    },
    {
      ar: {
        title: 'مخيمات جيل الطوفان',
        summary: 'نشاط سنوي مدته أسبوع كامل. [التواريخ والمكان والبرنامج مؤقتة]',
        body: paragraph(PLACEHOLDER.ar),
        location: '[المكان]',
      },
      en: {
        title: 'Jeel Al-Toufan Camp',
        summary: 'An annual, week-long activity. [Dates, location, and programme are placeholders]',
        body: paragraph(PLACEHOLDER.en),
        location: '[Location]',
      },
    },
  )
  log('camp event')

  // ── About page: real mission text, verbatim ──
  for (const locale of ['ar', 'en'] as const) {
    await payload.updateGlobal({
      slug: 'about-page',
      locale,
      overrideAccess: true,
      data: {
        title: locale === 'ar' ? 'عن الأكاديمية' : 'About the Academy',
        intro: paragraph(PLACEHOLDER[locale]),
        vision: PLACEHOLDER[locale],
        mission: MISSION[locale],
        pillars: PILLARS.map((p) => ({ title: p.title[locale], text: PLACEHOLDER[locale] })),
        goals: [1, 2, 3].map(() => ({ text: PLACEHOLDER[locale] })),
        structureIntro: paragraph(PLACEHOLDER[locale]),
      },
    })
  }
  log('about page')

  // ── Site settings + home page defaults ──
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      contactEmail: 'contact@jilaltufan.com',
      academyTimeZone: 'Asia/Hebron',
      joinLinkVisibility: 'window',
      joinWindowMinutes: 30,
      statsEnabled: false,
    },
  })
  for (const locale of ['ar', 'en'] as const) {
    await payload.updateGlobal({
      slug: 'home-page',
      locale,
      overrideAccess: true,
      data: {
        heroTitle:
          locale === 'ar' ? 'بالعلم **نتحرّر**' : 'Through knowledge, we are **liberated**',
        heroSubtitle: MISSION[locale],
        primaryCtaLabel: locale === 'ar' ? 'استكشف البرامج' : 'Explore programs',
        secondaryCtaLabel: locale === 'ar' ? 'سجّل الآن' : 'Apply now',
        showStats: false,
      },
    })
  }
  log('site settings + home page')

  log('done')
  process.exit(0)
}

// `payload run` awaits the module import, not a dangling promise — so top-level await.
try {
  await seed()
} catch (e) {
  const detail = (e as { data?: unknown }).data
  console.error(detail ? JSON.stringify(detail, null, 2) : e)
  process.exit(1)
}
