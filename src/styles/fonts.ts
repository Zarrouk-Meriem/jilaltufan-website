import { IBM_Plex_Sans_Arabic, Poppins } from 'next/font/google'

/**
 * Latin: Poppins (brand). Arabic: IBM Plex Sans Arabic as the stand-in for
 * Janna LT until licensed files exist in /public/fonts/janna/.
 *
 * To swap in Janna LT, replace `arabic` below with:
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

export const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export const fontVariables = `${latin.variable} ${arabic.variable}`
