/**
 * Seed data. Real program names only; every description is a marked placeholder
 * and every seeded record carries isPlaceholder: true. No people, dates, or
 * statistics are invented — see TODO.md for what the academy must supply.
 */
export const SEASON = { startYear: 2026, endYear: 2027 }

export const PLACEHOLDER = { ar: '[نص مؤقت]', en: '[Placeholder]' }

export type ProgramSeed = {
  slug: string
  track: 'open' | 'directed' | 'projects'
  order: number
  featured?: boolean
  title: { ar: string; en: string }
  /** Months are Payload keys; count 0 = no sessions (strategic projects). */
  season: { start: string; end: string; count: number }
  registrationMode: 'open' | 'application' | 'closed'
}

/**
 * The founding paper: one open track (Oct → May, eight lectures), four directed
 * programs (Jan → Jun, six sessions each, two theoretical and two applied), and the
 * strategic projects that accompany them. «سفراء القدس الشريف» was replaced by the
 * strategic-projects entry at the academy's request (Sep 2026).
 */
export const PROGRAMS: ProgramSeed[] = [
  {
    slug: 'open-training',
    track: 'open',
    order: 0,
    featured: true,
    title: { ar: 'التدريب المفتوح', en: 'Open Training' },
    season: { start: 'oct', end: 'may', count: 8 },
    registrationMode: 'open',
  },
  {
    slug: 'palestine-our-compass',
    track: 'directed',
    order: 1,
    title: { ar: 'فلسطين بوصلتنا', en: 'Palestine, Our Compass' },
    season: { start: 'jan', end: 'jun', count: 6 },
    registrationMode: 'application',
  },
  {
    slug: 'leaders-of-tomorrow',
    track: 'directed',
    order: 2,
    title: { ar: 'قادة الغد', en: 'Leaders of Tomorrow' },
    season: { start: 'jan', end: 'jun', count: 6 },
    registrationMode: 'application',
  },
  {
    slug: 'impact-makers',
    track: 'directed',
    order: 3,
    title: { ar: 'صنّاع الأثر', en: 'Impact Makers' },
    season: { start: 'jan', end: 'jun', count: 6 },
    registrationMode: 'application',
  },
  {
    slug: 'community-pioneers',
    track: 'directed',
    order: 4,
    title: { ar: 'روّاد المجتمع', en: 'Community Pioneers' },
    season: { start: 'jan', end: 'jun', count: 6 },
    registrationMode: 'application',
  },
  {
    slug: 'strategic-projects',
    track: 'projects',
    order: 5,
    title: { ar: 'المشاريع الاستراتيجية', en: 'Strategic Projects' },
    season: { start: 'oct', end: 'sep', count: 0 },
    registrationMode: 'closed',
  },
]

/** Renamed in place by the seed when the old placeholder record still exists. */
export const RENAMED_PROGRAMS: { from: string; to: string }[] = [
  { from: 'ambassadors-of-al-quds', to: 'strategic-projects' },
]

const ORDINALS = [
  { ar: 'الأولى', en: 'first' },
  { ar: 'الثانية', en: 'second' },
  { ar: 'الثالثة', en: 'third' },
  { ar: 'الرابعة', en: 'fourth' },
  { ar: 'الخامسة', en: 'fifth' },
  { ar: 'السادسة', en: 'sixth' },
  { ar: 'السابعة', en: 'seventh' },
  { ar: 'الثامنة', en: 'eighth' },
]
const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

/** Placeholder session months for a program: `count` months from its start month. */
export function seasonMonths(season: ProgramSeed['season']) {
  const startIdx = MONTH_INDEX[season.start]!
  return Array.from({ length: season.count }, (_, i) => {
    const idx = startIdx + i
    // The academy year starts in October: Oct–Dec belong to startYear, Jan–Sep to endYear.
    const m = idx % 12
    const y = m >= 9 ? SEASON.startYear : SEASON.endYear
    return { m, y, ar: ORDINALS[i]?.ar ?? String(i + 1), en: ORDINALS[i]?.en ?? String(i + 1) }
  })
}

export const MISSION = {
  ar: 'تقوم رسالة الأكاديمية على تمكين الشباب العربي والإسلامي، من خلال برامج تربوية ومعرفية وسياسية مكثّفة ومواكبة لتحديات ورهانات الطوفان، حيث تعتمد على مناهج علمية وأدوات عملية، لتعزيز الهوية ونصرة القضية الفلسطينية في مختلف الميادين.',
  en: "The Academy's mission is to empower Arab and Muslim youth through intensive educational, cognitive, and political programs that keep pace with the challenges and stakes of the flood, relying on scientific curricula and practical tools to strengthen identity and support the Palestinian cause in various fields.",
}

/**
 * Student / instructor window copy — the same built-in text as messages/*.json, entered
 * into Payload so editors have a starting point. The seed only writes it while the
 * globals are empty; the conduct line is a marked placeholder until the academy sends its own.
 */
export const WINDOWS: Record<
  'ar' | 'en',
  {
    how: string[]
    join: string[]
    conduct: string[]
    faq: [string, string][]
    guidelines: string[]
    materialsBody: string
    scheduleBody: string
  }
> = {
  ar: {
    how: [
      'جميع الحصص مباشرة على Zoom، ولا توجد تسجيلات.',
      'التدريب المفتوح ثماني محاضرات شهرية من أكتوبر إلى مايو، والبرامج الموجّهة ست حصص شهرية من يناير إلى يونيو.',
      'المواعيد معلنة بتوقيت القدس، ويعرض الموقع توقيتك المحلي إلى جانبه.',
      'يصلك رابط كل حصة بالبريد الإلكتروني قبل موعدها، ويظهر زر الانضمام على الموقع قبل البداية بـ {minutes} دقيقة.',
    ],
    join: [
      'ثبّت تطبيق Zoom على هاتفك أو حاسوبك مسبقًا.',
      'افتح رابط الحصة من البريد أو من الجدول عند ظهور زر الانضمام.',
      'ادخل باسمك الحقيقي كما سجّلته حتى يتعرّف عليك المحاضر.',
      'أبقِ الميكروفون مغلقًا حتى يُطلب منك التحدّث.',
    ],
    conduct: ['[نص مؤقت: يحدّده فريق الأكاديمية]'],
    faq: [
      ['هل تُسجَّل الحصص؟', 'لا. جميع الحصص مباشرة فقط.'],
      [
        'ماذا لو فاتتني حصة؟',
        'تواصل مع الأكاديمية عبر نافذة التواصل؛ لا توجد تسجيلات، لكن قد تتوفر مواد الحصة.',
      ],
      ['بأي توقيت تُعلن المواعيد؟', 'بتوقيت القدس. يعرض الموقع توقيتك المحلي بجانب كل موعد.'],
      ['كيف أعرف أن طلبي قُبل؟', 'يتواصل معك فريق الأكاديمية بالبريد الإلكتروني بعد مراجعة الطلب.'],
    ],
    guidelines: [
      'الحصص مباشرة على Zoom بتوقيت القدس؛ يُرجى الدخول قبل الموعد بعشر دقائق.',
      'مدة الحصة الافتراضية 90 دقيقة.',
      'الأكاديمية ترسل رابط Zoom للمشاركين؛ لا تُشارك الروابط علنًا.',
    ],
    materialsBody:
      'أرسل ملفات PDF أو الروابط إلى بريد الأكاديمية أو عبر نموذج التواصل، وسينشرها الفريق في صفحة المواد.',
    scheduleBody: 'تظهر حصصك القادمة في صفحة ملفك.',
  },
  en: {
    how: [
      'All sessions are live on Zoom; there are no recordings.',
      'Open Training is eight monthly lectures from October to May; the directed programs are six monthly sessions from January to June.',
      'Times are announced in Al-Quds time; the site shows your local time beside them.',
      "You receive each session's link by email before it starts, and the join button appears on the site {minutes} minutes before.",
    ],
    join: [
      'Install the Zoom app on your phone or computer in advance.',
      'Open the session link from the email, or from the schedule when the join button appears.',
      'Join with your real name as registered so the instructor recognises you.',
      "Keep your microphone muted until you're invited to speak.",
    ],
    conduct: ["[Placeholder: to be defined by the Academy's team]"],
    faq: [
      ['Are sessions recorded?', 'No. All sessions are live only.'],
      [
        'What if I miss a session?',
        'Contact the Academy through the contact form; there are no recordings, but session materials may be available.',
      ],
      [
        'In which time zone are times announced?',
        'Al-Quds time. The site shows your local time next to each session.',
      ],
      [
        'How will I know my application was accepted?',
        "The Academy's team contacts you by email after reviewing it.",
      ],
    ],
    guidelines: [
      'Sessions are live on Zoom in Al-Quds time; please join ten minutes early.',
      'The default session length is 90 minutes.',
      "The Academy sends the Zoom link to participants; don't share links publicly.",
    ],
    materialsBody:
      "Send PDFs or links to the Academy's email or through the contact form; the team publishes them on the materials page.",
    scheduleBody: 'Your upcoming sessions appear on your profile page.',
  },
}
