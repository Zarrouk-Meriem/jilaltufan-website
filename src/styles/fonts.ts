import localFont from 'next/font/local'
import { Poppins } from 'next/font/google'

/**
 * Latin: Poppins (brand). Arabic: Noto Kufi Arabic (OFL), chosen 2026-09-19 as the
 * free face closest to the humanist Kufi of Janna LT in the brand references.
 *
 * To swap in a licensed font (Janna LT), point `arabic` below at its files.
 * Nothing else changes — every stylesheet reads var(--font-arabic).
 */
export const latin = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  display: 'swap',
  // next/font always emits a "Poppins Fallback" face aliased to local Arial (which has
  // Arabic glyphs). globals.css therefore references 'Poppins' by bare name so Arabic
  // falls through to var(--font-arabic). Keep this in mind if you ever rename the font.
})

export const arabic = localFont({
  // A self-hosted subset of Noto Kufi Arabic (OFL, licence alongside): the Arabic
  // blocks only, no presentation forms, weight axis 400–700 — ≈ 43 kB instead of
  // Google's 124 kB build. Rebuild with scripts/subset-arabic-font.sh; the hero
  // paragraph is the LCP element and repaints when this file arrives, so its size
  // is the performance lever (TODO.md, 2026-09-20).
  src: [{ path: './fonts/NotoKufiArabic-subset.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-arabic',
  display: 'swap',
})

export const fontVariables = `${latin.variable} ${arabic.variable}`
