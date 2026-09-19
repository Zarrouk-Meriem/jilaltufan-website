import { Noto_Kufi_Arabic, Poppins } from 'next/font/google'

/**
 * Latin: Poppins (brand). Arabic: Noto Kufi Arabic (OFL), chosen 2026-09-19 as the
 * free face closest to the humanist Kufi of Janna LT in the brand references.
 *
 * To swap in a licensed local font, replace `arabic` below with:
 *   import localFont from 'next/font/local'
 *   const arabic = localFont({ src: [...], variable: '--font-arabic', display: 'swap' })
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

export const arabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  // Variable font: one file covers every weight the site uses.
  weight: 'variable',
  variable: '--font-arabic',
  display: 'swap',
})

export const fontVariables = `${latin.variable} ${arabic.variable}`
