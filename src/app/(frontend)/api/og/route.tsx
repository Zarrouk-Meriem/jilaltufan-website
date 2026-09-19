import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { shapeArabic } from '@/lib/og-arabic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Brand sheet values (tokens.css is the source of truth; Satori cannot read CSS variables).
const NAVY = '#004569'
const NAVY_DEEP = '#032A3F'
const RED = '#AD2E39'
const MUTED = 'rgba(255,255,255,0.78)'

/** Poppins for English text (Satori shapes Latin fine). Arabic is shaped by opentype.js — see og-arabic.ts. */
let poppins: Promise<Buffer> | null = null
const poppinsBold = () =>
  (poppins ??= readFile(join(process.cwd(), 'src/app/(frontend)/api/og/fonts/Poppins-Bold.ttf')))

const Mark = () => (
  <svg viewBox="0 0 675 814" width="44" height="53">
    <polygon points="481,0 675,326 480,326 194,814 0,814" fill={RED} />
  </svg>
)

/** Brand OG template: navy gradient, name + tagline, red rule, title, subtitle. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') ?? 'أكاديمية جيل الطوفان').slice(0, 120)
  const subtitle = (searchParams.get('subtitle') ?? '').slice(0, 160)
  const rtl = searchParams.get('locale') !== 'en'
  const titleSize = title.length > 40 ? 56 : 72

  const frame = {
    width: 1200,
    height: 630,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    padding: 72,
    background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
    color: '#fff',
  }

  if (rtl) {
    const [name, tagline, ttl, sub] = await Promise.all([
      shapeArabic('أكاديمية جيل الطوفان', 28, 700, 400),
      shapeArabic('بالعلم نتحرّر', 18, 400, 400, MUTED),
      shapeArabic(title, titleSize, 700, 1000),
      subtitle ? shapeArabic(subtitle, 28, 400, 1000, MUTED) : null,
    ])
    const img = (b: { dataUri: string; width: number; height: number }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={b.dataUri} width={b.width} height={b.height} alt="" />
    )
    return new ImageResponse(
      <div style={{ ...frame, alignItems: 'flex-end' }}>
        <div
          style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 20 }}
        >
          <Mark />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {img(name)}
            {img(tagline)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ width: 96, height: 6, background: RED }} />
          {img(ttl)}
          {sub ? img(sub) : null}
        </div>
      </div>,
      { width: 1200, height: 630 },
    )
  }

  return new ImageResponse(
    <div style={{ ...frame, alignItems: 'flex-start', fontFamily: 'Poppins' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Mark />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>Jil Altufan Academy</span>
          <span style={{ fontSize: 18, color: MUTED }}>Through knowledge, we are liberated</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ width: 96, height: 6, background: RED }} />
        <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.2, maxWidth: 1000 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 28, color: MUTED, maxWidth: 1000, lineHeight: 1.5 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Poppins', data: await poppinsBold(), weight: 700, style: 'normal' }],
    },
  )
}
