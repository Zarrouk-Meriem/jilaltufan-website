/**
 * Idempotent seed — safe to re-run. Upserts by slug; never overwrites a record
 * an editor has since marked isPlaceholder: false.
 *   pnpm seed
 */
import 'dotenv/config'
import config from '@payload-config'
import arMessages from '../../messages/ar.json'
import enMessages from '../../messages/en.json'
import { getPayload, type Payload, type Where } from 'payload'
import type { AboutPage } from '@/payload-types'

type RichText = NonNullable<AboutPage['intro']>
import {
  ABOUT_INTRO,
  AUDIENCE,
  type Block,
  CAMP,
  COMPETENCIES,
  GOALS,
  PROGRAM_CONTENT,
  REGISTRATION_NOTE,
  STRUCTURE,
  STRUCTURE_INTRO,
  VALUES,
  VISION,
} from './content'
import {
  MISSION,
  OPEN_TRAINING_TITLES,
  PLACEHOLDER,
  PROGRAMS,
  RENAMED_PROGRAMS,
  SEASON,
  seasonMonths,
  SOCIALS,
  WINDOWS,
} from './data'

type Locale = 'ar' | 'en'

const textNode = (text: string) => ({
  type: 'text',
  version: 1,
  text,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
})
const common = { format: '', indent: 0, version: 1, direction: null }

/** Lexical document from headings, paragraphs, and bullet lists. */
const richText = (blocks: Block[]): RichText =>
  ({
    root: {
      type: 'root',
      ...common,
      children: blocks.map((b) => {
        if (b.type === 'h')
          return { type: 'heading', tag: 'h2', ...common, children: [textNode(b.text)] }
        if (b.type === 'ul')
          return {
            type: 'list',
            listType: 'bullet',
            tag: 'ul',
            start: 1,
            ...common,
            children: b.items.map((item, i) => ({
              type: 'listitem',
              value: i + 1,
              ...common,
              children: [textNode(item)],
            })),
          }
        return {
          type: 'paragraph',
          textFormat: 0,
          textStyle: '',
          ...common,
          children: [textNode(b.text)],
        }
      }),
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

  // ── Programs: content from the founding paper; placeholder sessions per season ──
  for (const r of RENAMED_PROGRAMS) {
    const old = await payload.find({
      collection: 'programs',
      where: { slug: { equals: r.from } },
      limit: 1,
      overrideAccess: true,
    })
    const doc = old.docs[0]
    if (doc && doc.isPlaceholder !== false) {
      await payload.update({
        collection: 'programs',
        id: doc.id,
        data: { slug: r.to },
        overrideAccess: true,
      })
      log(`program ${r.from} → ${r.to} (renamed)`)
    }
  }
  for (const p of PROGRAMS) {
    const c = PROGRAM_CONTENT[p.slug]
    if (!c) throw new Error(`no content for ${p.slug}`)
    const directed = p.track === 'directed'
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
        registrationMode: p.registrationMode,
        seasonStartMonth: p.season.start,
        seasonEndMonth: p.season.end,
        sessionsCount: p.season.count,
      },
      {
        ar: {
          title: p.title.ar,
          shortDescription: c.short.ar,
          intro: richText(c.intro.ar),
          goals: (directed ? COMPETENCIES.ar : []).map((text) => ({ text })),
          targetAudience: richText(AUDIENCE.ar),
          durationSummary: c.duration.ar,
          registrationNote: richText(
            directed ? REGISTRATION_NOTE.ar : [{ type: 'p', text: PLACEHOLDER.ar }],
          ),
        },
        en: {
          title: p.title.en,
          shortDescription: c.short.en,
          intro: richText(c.intro.en),
          goals: (directed ? COMPETENCIES.en : []).map((text) => ({ text })),
          targetAudience: richText(AUDIENCE.en),
          durationSummary: c.duration.en,
          registrationNote: richText(
            directed ? REGISTRATION_NOTE.en : [{ type: 'p', text: PLACEHOLDER.en }],
          ),
        },
      },
    )
    log(`program ${p.slug} → ${program.id}`)

    const months = seasonMonths(p.season)
    const titles = p.slug === 'open-training' ? OPEN_TRAINING_TITLES : undefined
    for (let i = 0; i < months.length; i++) {
      const mo = months[i]!
      const number = i + 1
      await upsert(
        payload,
        'sessions',
        { and: [{ program: { equals: program.id } }, { number: { equals: number } }] },
        {
          program: program.id,
          number,
          startsAt: placeholderStart(mo.y, mo.m),
          // The lecturer file gives Open Training 90 to 120 minutes: the session holds the whole
          // slot; attendance measures what was actually held (heldMinutes in zoom/reconcile).
          durationMinutes: p.slug === 'open-training' ? 120 : 90,
          sessionStatus: 'scheduled',
          status: 'published',
        },
        {
          // Real titles where the academy has given them; the rest stay marked placeholders.
          ar: {
            title: titles?.ar[i] ?? `[الحصة ${mo.ar}]`,
            summary: PLACEHOLDER.ar,
          },
          en: {
            title: titles?.en[i] ?? `[Session ${number}: ${mo.en}]`,
            summary: PLACEHOLDER.en,
          },
        },
      )
    }
    // Placeholder sessions beyond the program's count (an earlier seed, or a renamed program).
    const extra = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { program: { equals: program.id } },
          { number: { greater_than: months.length } },
          { isPlaceholder: { equals: true } },
        ],
      },
      limit: 50,
      overrideAccess: true,
    })
    for (const x of extra.docs)
      await payload.delete({ collection: 'sessions', id: x.id, overrideAccess: true })
    log(
      `  ${months.length} sessions for ${p.slug}${extra.docs.length ? ` (removed ${extra.docs.length} extra)` : ''}`,
    )
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
      // The founding paper: the camp closes the season in September; exact days unknown.
      startDate: new Date(Date.UTC(SEASON.endYear, 8, 1, 6)).toISOString(),
      endDate: new Date(Date.UTC(SEASON.endYear, 8, 7, 18)).toISOString(),
    },
    {
      ar: {
        title: 'مخيمات جيل الطوفان',
        summary: CAMP.summary.ar,
        body: richText(CAMP.body.ar),
        location: '[المكان]',
      },
      en: {
        title: 'Jil Altufan Camp',
        summary: CAMP.summary.en,
        body: richText(CAMP.body.en),
        location: '[Location]',
      },
    },
  )
  log('camp event')

  // ── About page: the founding paper and the institutions guide ──
  for (const locale of ['ar', 'en'] as const) {
    await payload.updateGlobal({
      slug: 'about-page',
      locale,
      overrideAccess: true,
      data: {
        _status: 'published' as const,
        title: locale === 'ar' ? 'عن الأكاديمية' : 'About the Academy',
        intro: richText(ABOUT_INTRO[locale]),
        vision: VISION[locale],
        mission: MISSION[locale],
        pillars: VALUES.map((v) => ({ title: v.title[locale], text: v.text[locale] })),
        goals: GOALS[locale].map((text) => ({ text })),
        structureIntro: richText(STRUCTURE_INTRO[locale]),
        structure: STRUCTURE.map((u) => ({
          name: u.name[locale],
          kind: u.kind,
          description: u.description[locale],
          members: u.members.map((m) => ({ name: m.name[locale], role: m.role[locale] })),
        })),
      },
    })
  }
  log('about page')

  // ── Student / instructor windows: built-in copy, only while an editor has not filled them ──
  const students = await payload.findGlobal({
    slug: 'students-page',
    overrideAccess: true,
    depth: 0,
  })
  if (!students.howSteps?.length && !students.faq?.length) {
    for (const locale of ['ar', 'en'] as const) {
      const w = WINDOWS[locale]
      await payload.updateGlobal({
        slug: 'students-page',
        locale,
        overrideAccess: true,
        data: {
          _status: 'published' as const,
          howSteps: w.how.map((text) => ({ text })),
          joinSteps: w.join.map((text) => ({ text })),
          conduct: w.conduct,
          rights: w.rights,
          faq: w.faq.map(([question, answer]) => ({ question, answer })),
        },
      })
    }
    log('students window')
  } else log('skip students window (editor-owned)')
  // The participation charter arrived after the window was seeded (2026-09-26): replace it
  // while it is still the placeholder (or empty), never once an editor has written their own.
  const charterIsPlaceholder = (rows: { text: string }[] | null | undefined) =>
    !rows?.length || rows.every((r) => /^\[(نص مؤقت|Placeholder)/.test(r.text))
  for (const locale of ['ar', 'en'] as const) {
    const current = await payload.findGlobal({
      slug: 'students-page',
      locale,
      fallbackLocale: false,
      overrideAccess: true,
      depth: 0,
    })
    if (!charterIsPlaceholder(current.conduct)) {
      log(`skip charter ${locale} (editor-owned)`)
      continue
    }
    await payload.updateGlobal({
      slug: 'students-page',
      locale,
      overrideAccess: true,
      data: {
        _status: 'published' as const,
        conduct: WINDOWS[locale].conduct,
        rights: WINDOWS[locale].rights,
      },
    })
    log(`charter ${locale}`)
  }
  const instructorsPage = await payload.findGlobal({
    slug: 'instructors-page',
    overrideAccess: true,
    depth: 0,
  })
  if (!instructorsPage.guidelines?.length) {
    for (const locale of ['ar', 'en'] as const) {
      const w = WINDOWS[locale]
      await payload.updateGlobal({
        slug: 'instructors-page',
        locale,
        overrideAccess: true,
        data: {
          _status: 'published' as const,
          guidelines: w.guidelines.map((text) => ({ text })),
          materialsBody: w.materialsBody,
          scheduleBody: w.scheduleBody,
        },
      })
    }
    log('instructors window')
  } else log('skip instructors window (editor-owned)')

  // ── Site settings + home page defaults ──
  // Social links: add any official account the list lacks; keep the editor's rows and order.
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 0,
  })
  const existing = settings.socials ?? []
  const missing = SOCIALS.filter((o) => !existing.some((s) => s.platform === o.platform))
  const seedSocials = missing.length > 0
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      contactEmail: 'contact@jilaltufan.org',
      applicationsEmail: 'applications@jilaltufan.org',
      academyTimeZone: 'Asia/Hebron',
      joinLinkVisibility: 'window',
      joinWindowMinutes: 30,
      statsEnabled: false,
      ...(seedSocials ? { socials: [...existing, ...missing] } : {}),
    },
  })
  log(
    seedSocials
      ? `social links + ${missing.map((m) => m.platform).join(', ')}`
      : 'skip social links (complete)',
  )
  // Home page: fill what is empty, never what an editor wrote (until 2026-09-26 this block
  // overwrote the hero on every run, and a production seed reset an edited subtitle).
  for (const locale of ['ar', 'en'] as const) {
    const home = await payload.findGlobal({
      slug: 'home-page',
      locale,
      fallbackLocale: false,
      overrideAccess: true,
      depth: 0,
    })
    const m = (locale === 'ar' ? arMessages : enMessages).home
    const defaults = {
      heroTitle: locale === 'ar' ? 'بالعلم **نتحرّر**' : 'Through knowledge, we are **liberated**',
      heroSubtitle: MISSION[locale],
      primaryCtaLabel: locale === 'ar' ? 'استكشف البرامج' : 'Explore programs',
      secondaryCtaLabel: locale === 'ar' ? 'سجّل الآن' : 'Apply now',
      missionTitle: m.missionTitle,
      missionText: MISSION[locale],
      programsTitle: m.programsTitle,
      programsIntro: m.programsIntro,
      seasonTitle: m.seasonTitle,
      seasonIntro: m.seasonIntro,
      upcomingTitle: m.upcomingTitle,
      upcomingIntro: m.upcomingIntro,
      campTitle: m.campTitle,
      campIntro: m.campIntro,
      campCtaLabel: m.campCta,
      minbarTitle: m.minbarTitle,
      instructorsTitle: m.instructorsTitle,
      statsTitle: m.statsTitle,
      closingTitle: m.closingTitle,
      closingText: m.closingText,
    } as const
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(defaults))
      if (!String((home as unknown as Record<string, unknown>)[k] ?? '').trim()) data[k] = v
    if (!home.pillars?.length)
      data.pillars = Object.values(m.pillars).map((x) => ({ title: x.title, text: x.text }))
    if (!Object.keys(data).length) {
      log(`skip home page ${locale} (complete)`)
      continue
    }
    await payload.updateGlobal({
      slug: 'home-page',
      locale,
      overrideAccess: true,
      data: { ...data, _status: 'published' },
    })
    log(`home page ${locale} + ${Object.keys(data).join(', ')}`)
  }
  log('site settings')

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
