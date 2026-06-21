import type { Mode } from '../types';

/**
 * 大人・子どもの人数から運用モードを導出。
 * - 大人2人以上 → multi-adult（荷物分担を推奨）
 * - 大人1人＋子ども1人以上 → solo-parent（ワンオペ）
 * - それ以外（大人のみ 等）→ null
 * multi-adult を優先（2人以上いれば分担のほうが有意義）。
 */
export function resolveMode(adultCount: number, childCount: number): Mode | null {
  if (adultCount >= 2) return 'multi-adult';
  if (adultCount === 1 && childCount >= 1) return 'solo-parent';
  return null;
}
