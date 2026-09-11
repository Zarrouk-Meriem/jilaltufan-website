/**
 * Seed data. Real program names only; every description is a marked placeholder
 * and every seeded record carries isPlaceholder: true. No people, dates, or
 * statistics are invented — see TODO.md for what the academy must supply.
 */
export const SEASON = { startYear: 2026, endYear: 2027 }

export const PLACEHOLDER = { ar: '[نص مؤقت]', en: '[Placeholder]' }

export type ProgramSeed = {
  slug: string
  track: 'open' | 'directed'
  order: number
  featured?: boolean
  title: { ar: string; en: string }
}

export const PROGRAMS: ProgramSeed[] = [
  {
    slug: 'open-training',
    track: 'open',
    order: 0,
    featured: true,
    title: { ar: 'التدريب المفتوح', en: 'Open Training' },
  },
  {
    slug: 'palestine-our-compass',
    track: 'directed',
    order: 1,
    title: { ar: 'فلسطين بوصلتنا', en: 'Palestine, Our Compass' },
  },
  {
    slug: 'leaders-of-tomorrow',
    track: 'directed',
    order: 2,
    title: { ar: 'قادة الغد', en: 'Leaders of Tomorrow' },
  },
  {
    slug: 'impact-makers',
    track: 'directed',
    order: 3,
    title: { ar: 'صنّاع الأثر', en: 'Impact Makers' },
  },
  {
    slug: 'community-pioneers',
    track: 'directed',
    order: 4,
    title: { ar: 'روّاد المجتمع', en: 'Community Pioneers' },
  },
  {
    slug: 'ambassadors-of-al-quds',
    track: 'directed',
    order: 5,
    title: { ar: 'سفراء القدس الشريف', en: 'Ambassadors of Al-Quds Al-Sharif' },
  },
]

/** Sep → Apr; month index is 0-based for Date. */
export const SEASON_MONTHS = [
  { m: 8, y: SEASON.startYear, ar: 'الأولى', en: 'first' },
  { m: 9, y: SEASON.startYear, ar: 'الثانية', en: 'second' },
  { m: 10, y: SEASON.startYear, ar: 'الثالثة', en: 'third' },
  { m: 11, y: SEASON.startYear, ar: 'الرابعة', en: 'fourth' },
  { m: 0, y: SEASON.endYear, ar: 'الخامسة', en: 'fifth' },
  { m: 1, y: SEASON.endYear, ar: 'السادسة', en: 'sixth' },
  { m: 2, y: SEASON.endYear, ar: 'السابعة', en: 'seventh' },
  { m: 3, y: SEASON.endYear, ar: 'الثامنة', en: 'eighth' },
]

export const MISSION = {
  ar: 'تقوم رسالة الأكاديمية على تمكين الشباب العربي والإسلامي، من خلال برامج تربوية ومعرفية وسياسية مكثّفة ومواكبة لتحديات ورهانات الطوفان، حيث تعتمد على مناهج علمية وأدوات عملية، لتعزيز الهوية ونصرة القضية الفلسطينية في مختلف الميادين.',
  en: "The Academy's mission is to empower Arab and Muslim youth through intensive educational, cognitive, and political programs that keep pace with the challenges and stakes of the flood, relying on scientific curricula and practical tools to strengthen identity and support the Palestinian cause in various fields.",
}

export const PILLARS = [
  { title: { ar: 'تربوية', en: 'Educational' } },
  { title: { ar: 'معرفية', en: 'Cognitive' } },
  { title: { ar: 'سياسية', en: 'Political' } },
]
