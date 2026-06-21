import type { Mode } from '../types';
import type { EvalContext, GeneratedItem } from './evaluate';

/** 荷物分担案の1ロール（誰が・どのバッグで・何を持つ）。 */
export interface BaggageRole {
  readonly carrier: string;
  readonly bag: string;
  readonly items: readonly string[];
}

/** 荷物分担案。multi-adult のときのみ生成される。 */
export interface SharingPlan {
  readonly mode: Mode;
  readonly summary: string;
  readonly roles: readonly BaggageRole[];
}

const MAX_PER_ROLE = 6;

/**
 * multi-adult のとき、アイテムを重い系（baby/food/common）と軽い系（destination/mode）に分け、
 * メインバッグ（リュック）とサブバッグに振り分ける案を生成。
 */
export function buildSharingPlan(
  ctx: EvalContext,
  items: readonly GeneratedItem[],
): SharingPlan | null {
  if (ctx.mode !== 'multi-adult' || ctx.adults.length < 2) return null;
  const [primary, secondary] = ctx.adults;

  const heavy: string[] = [];
  const light: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.ruleId)) continue;
    seen.add(it.ruleId);
    if (it.category === 'baby' || it.category === 'food' || it.category === 'common') {
      heavy.push(it.label);
    } else {
      light.push(it.label);
    }
  }

  const primaryItems = heavy.slice(0, MAX_PER_ROLE);
  const secondaryItems = [...light, ...heavy.slice(MAX_PER_ROLE)].slice(0, MAX_PER_ROLE);

  return {
    mode: 'multi-adult',
    summary: '荷物を2つに分けて両手を確保しましょう',
    roles: [
      { carrier: primary.name, bag: 'メインバッグ（リュック）', items: primaryItems },
      { carrier: secondary.name, bag: 'サブバッグ', items: secondaryItems },
    ],
  };
}
