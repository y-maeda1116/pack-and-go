import type { AgeBand } from '../types';

/** ISO 日付（YYYY-MM-DD）を {year, month, day} にパース。不正なら null。 */
export function parseISODate(
  iso: string,
): { readonly year: number; readonly month: number; readonly day: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m || m[1] === undefined || m[2] === undefined || m[3] === undefined) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * 生年月日と基準日から満月齢を計算。
 * 月跨ぎ前に日付が来ていなければ（誕生日前）1減らす。未来日なら 0。
 * today を外部注入可能にしてテスト容易にしている。
 */
export function ageMonthsBetween(birthISO: string, today: Date): number {
  const b = parseISODate(birthISO);
  if (!b) return 0;
  let months = (today.getFullYear() - b.year) * 12 + (today.getMonth() + 1 - b.month);
  if (today.getDate() < b.day) months -= 1;
  return Math.max(0, months);
}

/** 月齢から年齢バンドへ。 */
export function bandForMonths(months: number): AgeBand {
  if (months < 12) return 'infant';
  if (months < 36) return 'toddler';
  if (months < 72) return 'preschool';
  return 'school';
}

/** 表示用の年齢文字列。 */
export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}ヶ月`;
  if (rem === 0) return `${years}歳`;
  return `${years}歳${rem}ヶ月`;
}

export const BAND_LABEL: Readonly<Record<AgeBand, string>> = Object.freeze({
  infant: '乳児',
  toddler: '幼児',
  preschool: '幼児',
  school: '学童',
});

/** バンドごとに何モードの持ち物になるかの短縮ラベル。 */
export const BAND_MODE_LABEL: Readonly<Record<AgeBand, string>> = Object.freeze({
  infant: '🍼 オムツ・ミルクモード',
  toddler: '🍼 オムツ・離乳食モード',
  preschool: '🍪 おやつ・着替えモード',
  school: '🎒 水筒・着替えモード',
});
