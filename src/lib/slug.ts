/**
 * Arabic → Latin transliteration for slugs. Deliberately simple and stable:
 * editors can always override the result in the admin.
 */
const MAP: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'a',
  ء: '',
  ؤ: 'w',
  ئ: 'y',
  ﻻ: 'la',
  لا: 'la',
}

export function transliterate(input: string): string {
  return Array.from(input.normalize('NFC'))
    .map((ch) => MAP[ch] ?? ch)
    .join('')
}

export function slugify(input: string): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '') // harakat
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
