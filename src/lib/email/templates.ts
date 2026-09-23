/** Plain, calm transactional emails. Text + minimal HTML, both locales. */
type Locale = 'ar' | 'en'

const dir = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr')

/** A single call to action: a button in HTML, the bare URL in the plain-text part. */
type Action = { label: string; href: string }

function wrap(
  locale: Locale,
  title: string,
  paragraphs: string[],
  action?: Action,
): { text: string; html: string } {
  const text = [title, '', ...paragraphs, ...(action ? ['', action.label, action.href] : [])].join(
    '\n',
  )
  // Mail clients strip most CSS; the button is a plain anchor with inline styles, and the
  // URL is repeated underneath so it survives a client that renders no styles at all.
  const button = action
    ? `<p style="margin:24px 0"><a href="${esc(action.href)}" style="display:inline-block;background:#ad2e39;color:#fff;text-decoration:none;padding:12px 20px;border-radius:2px;font-weight:600">${esc(action.label)}</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#5b6569;word-break:break-all"><a href="${esc(action.href)}" style="color:#5b6569">${esc(action.href)}</a></p>`
    : ''
  const html = `<!doctype html><html lang="${locale}" dir="${dir(locale)}"><body style="margin:0;padding:32px;background:#f7f7f5;font-family:Poppins,'Noto Kufi Arabic',system-ui,sans-serif;color:#2b3439;line-height:1.7">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid rgba(5,7,8,.12)">
<div style="width:48px;height:3px;background:#ad2e39;margin-bottom:20px"></div>
<h1 style="margin:0 0 16px;font-size:20px;color:#050708">${esc(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;white-space:pre-line">${esc(p)}</p>`).join('\n')}
${button}</div></body></html>`
  return { text, html }
}
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const SIGN_AR = 'أكاديمية جيل الطوفان — بالعلم نتحرّر'
const SIGN_EN = 'Jil Altufan Academy — Through knowledge, we are liberated'
const REPLY_AR = 'إن كان لديك سؤال، يكفي أن تردّ على هذه الرسالة.'
const REPLY_EN = 'If you have a question, simply reply to this email.'
const FOLLOW_AR = 'تابع حالة طلبك'
const FOLLOW_EN = 'Follow your application'
const KEEP_AR = 'الرابط خاص بك وحدك، فلا تشاركه مع أحد.'
const KEEP_EN = 'The link is yours alone; please do not share it.'

/**
 * The applicant's confirmation: one application for the academy, program chosen after
 * acceptance. It carries the follow-up link (PLAN.md §13.3) so the applicant can see where
 * the application stands without an account and without writing to ask.
 */
export function applicantEmail(locale: Locale, name: string, followUrl?: string) {
  // The link is minted with the row, so it is always there; the letter is still sendable
  // without it rather than going out with a broken address in it.
  const action = followUrl
    ? { label: locale === 'ar' ? FOLLOW_AR : FOLLOW_EN, href: followUrl }
    : undefined
  if (locale === 'ar') {
    const subject = 'استلمنا طلب التحاقك بأكاديمية جيل الطوفان'
    return {
      subject,
      ...wrap(
        'ar',
        subject,
        [
          `أهلًا ${name}،`,
          'استلمنا طلبك للالتحاق بالأكاديمية. سيراجعه فريق الأكاديمية ويتواصل معك على هذا البريد بعد المراجعة، وعند القبول تختار برنامجك.',
          ...(followUrl ? [`يمكنك متابعة حالة طلبك في أي وقت من الرابط أدناه. ${KEEP_AR}`] : []),
          'جميع الحصص مباشرة على Zoom بتوقيت القدس.',
          REPLY_AR,
          SIGN_AR,
        ],
        action,
      ),
    }
  }
  const subject = 'We received your application to Jil Altufan Academy'
  return {
    subject,
    ...wrap(
      'en',
      subject,
      [
        `Hello ${name},`,
        "We received your application to the Academy. The Academy's team will review it and be in touch at this address; once accepted, you choose your program.",
        ...(followUrl
          ? [
              `You can check where your application stands at any time from the link below. ${KEEP_EN}`,
            ]
          : []),
        'All sessions are live on Zoom, in Al-Quds time.',
        REPLY_EN,
        SIGN_EN,
      ],
      action,
    ),
  }
}

/**
 * A fresh follow-up link, asked for from the page itself when the old one has expired. It
 * can only ever go to the address already on the application — the page takes no address
 * from the visitor — so it says so plainly rather than acknowledging a request it cannot
 * verify came from the applicant.
 */
export function statusLinkEmail(locale: Locale, name: string, followUrl: string) {
  if (locale === 'ar') {
    const subject = 'رابط جديد لمتابعة طلب التحاقك'
    return {
      subject,
      ...wrap(
        'ar',
        subject,
        [
          `أهلًا ${name}،`,
          `طُلب رابط جديد لمتابعة طلبك، وهذا هو. ${KEEP_AR}`,
          'إن لم تطلبه أنت، تجاهل هذه الرسالة: الرابط القديم انتهت صلاحيته، ولا يصل أي رابط إلا إلى بريدك هذا.',
          REPLY_AR,
          SIGN_AR,
        ],
        { label: FOLLOW_AR, href: followUrl },
      ),
    }
  }
  const subject = 'A new link to follow your application'
  return {
    subject,
    ...wrap(
      'en',
      subject,
      [
        `Hello ${name},`,
        `A new link to follow your application was requested, and here it is. ${KEEP_EN}`,
        'If it was not you, ignore this message: the old link has expired, and a link is only ever sent to this address of yours.',
        REPLY_EN,
        SIGN_EN,
      ],
      { label: FOLLOW_EN, href: followUrl },
    ),
  }
}

/** One labelled line per answer; empty answers are dropped. */
export type NotificationLine = [label: string, value: string | undefined | null]

export function academyNotification(a: {
  fullName: string
  lines: NotificationLine[]
  adminUrl: string
  cvUrl?: string
}) {
  const subject = `طلب التحاق جديد: ${a.fullName}`
  return {
    subject,
    ...wrap(
      'ar',
      subject,
      [
        ...a.lines.filter((l): l is [string, string] => !!l[1]).map(([k, v]) => `${k}: ${v}`),
        a.cvUrl ? `السيرة الذاتية: ${a.cvUrl}` : '',
        `الإدارة: ${a.adminUrl}`,
      ].filter(Boolean),
    ),
  }
}

/**
 * Sent once when staff move an application to «reviewing» (from «new» only): the applicant
 * hears that a person is reading it and when to expect an answer. The two-week horizon was
 * set by the academy on 2026-09-22.
 */
export function reviewingEmail(locale: Locale, name: string) {
  if (locale === 'ar') {
    const subject = 'طلب التحاقك قيد المراجعة'
    return {
      subject,
      ...wrap('ar', subject, [
        `أهلًا ${name}،`,
        'طلبك الآن بين يدي فريق الأكاديمية. نقرأ كل طلب بعناية، وستصلك إجابتنا على هذا البريد خلال أسبوعين على الأكثر.',
        'لا حاجة إلى أي خطوة من جهتك حاليًا.',
        REPLY_AR,
        SIGN_AR,
      ]),
    }
  }
  const subject = 'Your application is under review'
  return {
    subject,
    ...wrap('en', subject, [
      `Hello ${name},`,
      "Your application is now with the Academy's team. We read every application carefully, and you will have our answer at this address within two weeks at most.",
      'Nothing is needed from you for now.',
      REPLY_EN,
      SIGN_EN,
    ]),
  }
}

/**
 * Sent once when staff move an application to «accepted». The program line appears only
 * when one has been assigned; otherwise the team settles it with the applicant by email.
 */
export function acceptanceEmail(locale: Locale, name: string, program?: string) {
  if (locale === 'ar') {
    const subject = 'قُبِل طلب التحاقك بأكاديمية جيل الطوفان'
    return {
      subject,
      ...wrap('ar', subject, [
        `أهلًا ${name}،`,
        'يسرّنا أن نبلغك بقبول طلب التحاقك بأكاديمية جيل الطوفان. مرحبًا بك بيننا.',
        program
          ? `برنامجك: ${program}.`
          : 'سيتواصل معك فريق الأكاديمية على هذا البريد لتحديد برنامجك.',
        'جميع الحصص مباشرة على Zoom بتوقيت القدس، وستصلك التفاصيل على هذا البريد قبل الانطلاق.',
        REPLY_AR,
        SIGN_AR,
      ]),
    }
  }
  const subject = 'Your application to Jil Altufan Academy has been accepted'
  return {
    subject,
    ...wrap('en', subject, [
      `Hello ${name},`,
      'We are glad to let you know that your application to Jil Altufan Academy has been accepted. Welcome.',
      program
        ? `Your program: ${program}.`
        : "The Academy's team will be in touch at this address to settle your program.",
      'All sessions are live on Zoom, in Al-Quds time; the details will reach you at this address before the start.',
      REPLY_EN,
      SIGN_EN,
    ]),
  }
}

/** Sent once when staff move an application to «waitlisted»: still in, and what happens next. */
export function waitlistEmail(locale: Locale, name: string) {
  if (locale === 'ar') {
    const subject = 'طلب التحاقك على قائمة الانتظار'
    return {
      subject,
      ...wrap('ar', subject, [
        `أهلًا ${name}،`,
        'راجع فريق الأكاديمية طلبك، وطلبك مقبول من حيث المبدأ، غير أن المقاعد المتاحة الآن محدودة، فوضعناك على قائمة الانتظار.',
        'ما إن يتوفر مقعد نكتب إليك على هذا البريد. لا حاجة إلى تقديم طلب جديد.',
        REPLY_AR,
        SIGN_AR,
      ]),
    }
  }
  const subject = 'Your application is on the waiting list'
  return {
    subject,
    ...wrap('en', subject, [
      `Hello ${name},`,
      "The Academy's team has reviewed your application. It stands, but the places available right now are limited, so we have put you on the waiting list.",
      'As soon as a place opens we will write to you at this address. There is no need to apply again.',
      REPLY_EN,
      SIGN_EN,
    ]),
  }
}

/**
 * Sent only when staff tick «send the rejection email» on a rejected application — never
 * on the status change alone, because it cannot be unsent.
 */
export function rejectionEmail(locale: Locale, name: string) {
  if (locale === 'ar') {
    const subject = 'بشأن طلب التحاقك بأكاديمية جيل الطوفان'
    return {
      subject,
      ...wrap('ar', subject, [
        `أهلًا ${name}،`,
        'شكرًا لك على اهتمامك بأكاديمية جيل الطوفان وعلى الوقت الذي بذلته في طلبك. بعد المراجعة، لم نتمكن من منحك مقعدًا هذه المرة.',
        'هذا لا يغلق الباب: يسعدنا أن تتقدم مجددًا في فرصة قادمة، وأن تتابع الأكاديمية على موقعها وصفحاتها.',
        REPLY_AR,
        SIGN_AR,
      ]),
    }
  }
  const subject = 'About your application to Jil Altufan Academy'
  return {
    subject,
    ...wrap('en', subject, [
      `Hello ${name},`,
      'Thank you for your interest in Jil Altufan Academy and for the time you put into your application. After review, we were not able to offer you a place this time.',
      'This does not close the door: we would be glad to see you apply again at a coming opportunity, and to have you follow the Academy on its site and pages.',
      REPLY_EN,
      SIGN_EN,
    ]),
  }
}
