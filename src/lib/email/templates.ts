/** Plain, calm transactional emails. Text + minimal HTML, both locales. */
type Locale = 'ar' | 'en'
type Mode = 'open' | 'application' | 'closed'

const dir = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr')

function wrap(locale: Locale, title: string, paragraphs: string[]): { text: string; html: string } {
  const text = [title, '', ...paragraphs].join('\n')
  const html = `<!doctype html><html lang="${locale}" dir="${dir(locale)}"><body style="margin:0;padding:32px;background:#f7f7f5;font-family:Poppins,'IBM Plex Sans Arabic',system-ui,sans-serif;color:#2b3439;line-height:1.7">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid rgba(5,7,8,.12)">
<div style="width:48px;height:3px;background:#c3272e;margin-bottom:20px"></div>
<h1 style="margin:0 0 16px;font-size:20px;color:#050708">${esc(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;white-space:pre-line">${esc(p)}</p>`).join('\n')}
</div></body></html>`
  return { text, html }
}
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function applicantEmail(locale: Locale, mode: Mode, name: string, program: string) {
  if (locale === 'ar') {
    const subject =
      mode === 'open' ? `تم تسجيلك في ${program}` : `استلمنا طلبك للالتحاق بـ ${program}`
    return {
      subject,
      ...wrap('ar', subject, [
        `أهلًا ${name}،`,
        mode === 'open'
          ? `تم تسجيلك في برنامج «${program}». سنرسل إليك رابط كل حصة قبل موعدها بالبريد الإلكتروني.`
          : `استلمنا طلبك للالتحاق ببرنامج «${program}». سيراجعه فريق الأكاديمية ويتواصل معك بعد المراجعة على هذا البريد.`,
        'جميع الحصص مباشرة على Zoom بتوقيت القدس.',
        'إن كان لديك سؤال، يكفي أن تردّ على هذه الرسالة.',
        'أكاديمية جيل الطوفان — بالعلم نتحرّر',
      ]),
    }
  }
  const subject =
    mode === 'open'
      ? `You're registered for ${program}`
      : `We received your application to ${program}`
  return {
    subject,
    ...wrap('en', subject, [
      `Hello ${name},`,
      mode === 'open'
        ? `You're registered for "${program}". We'll email you the link to each session before it starts.`
        : `We received your application to "${program}". The Academy's team will review it and be in touch at this address.`,
      'All sessions are live on Zoom, in Al-Quds time.',
      'If you have a question, simply reply to this email.',
      'Jeel Al-Toufan Academy — Through knowledge, we are liberated',
    ]),
  }
}

/** One labelled line per answer; empty answers are dropped. */
export type NotificationLine = [label: string, value: string | undefined | null]

export function academyNotification(a: {
  program: string
  fullName: string
  lines: NotificationLine[]
  adminUrl: string
  cvUrl?: string
}) {
  const subject = `طلب جديد: ${a.program} — ${a.fullName}`
  return {
    subject,
    ...wrap(
      'ar',
      subject,
      [
        `البرنامج: ${a.program}`,
        ...a.lines.filter((l): l is [string, string] => !!l[1]).map(([k, v]) => `${k}: ${v}`),
        a.cvUrl ? `السيرة الذاتية: ${a.cvUrl}` : '',
        `الإدارة: ${a.adminUrl}`,
      ].filter(Boolean),
    ),
  }
}
