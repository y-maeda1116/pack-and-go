import type {
  AgeBand,
  ChildProfile,
  DestinationId,
  Flag,
  GenerationInput,
  ItemCategory,
  ItemRule,
  ItemWhen,
  Member,
  Mode,
  RouteNoteRule,
} from '../types';
import { ageMonthsBetween, bandForMonths } from './age';
import { evaluateExpr, formatQty } from './expr';
import { resolveMode } from './mode';

/** ルール評価に必要な導出済みコンテキスト。 */
export interface EvalContext {
  readonly selectedMembers: readonly Member[];
  readonly children: readonly ChildProfile[];
  readonly adults: readonly Member[];
  readonly bandsPresent: ReadonlySet<AgeBand>;
  readonly destination: DestinationId;
  readonly hours: number;
  readonly mode: Mode | null;
  readonly flags: ReadonlySet<Flag>;
}

/** 生成された持ち物1件。 */
export interface GeneratedItem {
  /** リスト内で一意。shared は ruleId、per-person は "ruleId::memberId"。 */
  readonly id: string;
  readonly ruleId: string;
  readonly label: string;
  readonly category: ItemCategory;
  readonly owner?: string;
  readonly note?: string;
}

/** 生成された動線メモ1件。 */
export interface GeneratedRouteNote {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

/** 選択入力と全メンバーから評価コンテキストを構築。today は外部注入（テスト容易）。 */
export function buildContext(
  allMembers: readonly Member[],
  input: GenerationInput,
  today: Date,
): EvalContext {
  const selected = allMembers.filter((m) => input.selectedMemberIds.includes(m.id));
  const children: ChildProfile[] = selected
    .filter((m): m is Member => m.type === 'child' && typeof m.birthDate === 'string')
    .map((m) => {
      const ageMonths = ageMonthsBetween(m.birthDate as string, today);
      return { member: m, ageMonths, band: bandForMonths(ageMonths) };
    });
  const adults = selected.filter((m) => m.type === 'adult');
  const bandsPresent = new Set<AgeBand>(children.map((c) => c.band));
  const flags = new Set<Flag>(input.flags);
  if (children.some((c) => c.member.usesStroller)) flags.add('stroller');
  const mode = resolveMode(adults.length, children.length);
  return {
    selectedMembers: selected,
    children,
    adults,
    bandsPresent,
    destination: input.destination,
    hours: input.hours,
    mode,
    flags,
  };
}

/** 発火条件をコンテキストに対して判定（すべて AND）。 */
export function matchWhen(when: ItemWhen, ctx: EvalContext): boolean {
  if (when.childBand && !when.childBand.some((b) => ctx.bandsPresent.has(b))) return false;
  if (when.destinations && !when.destinations.includes(ctx.destination)) return false;
  if (typeof when.minHours === 'number' && ctx.hours < when.minHours) return false;
  if (typeof when.maxHours === 'number' && ctx.hours > when.maxHours) return false;
  if (when.mode && (!ctx.mode || !when.mode.includes(ctx.mode))) return false;
  if (when.flags && !when.flags.some((f) => ctx.flags.has(f))) return false;
  return true;
}

function computeNote(rule: ItemRule, hours: number): string | undefined {
  if (!rule.qty) return undefined;
  try {
    const n = evaluateExpr(rule.qty.expr, hours);
    return formatQty(rule.qty.note, n);
  } catch {
    return rule.qty.note.replace('{n}', '');
  }
}

/** ルール全体を評価して持ち物リストを生成。 */
export function generateItems(rules: readonly ItemRule[], ctx: EvalContext): GeneratedItem[] {
  const items: GeneratedItem[] = [];
  for (const rule of rules) {
    if (!matchWhen(rule.when, ctx)) continue;
    const note = computeNote(rule, ctx.hours);
    if (rule.scope === 'shared') {
      items.push({ id: rule.id, ruleId: rule.id, label: rule.label, category: rule.category, note });
    } else if (rule.scope === 'per-child') {
      for (const c of ctx.children) {
        items.push({
          id: `${rule.id}::${c.member.id}`,
          ruleId: rule.id,
          label: rule.label,
          category: rule.category,
          owner: c.member.name,
          note,
        });
      }
    } else {
      for (const a of ctx.adults) {
        items.push({
          id: `${rule.id}::${a.id}`,
          ruleId: rule.id,
          label: rule.label,
          category: rule.category,
          owner: a.name,
          note,
        });
      }
    }
  }
  return items;
}

/** 動線メモルールを評価して表示対象を生成。 */
export function generateRouteNotes(
  rules: readonly RouteNoteRule[],
  ctx: EvalContext,
): GeneratedRouteNote[] {
  return rules
    .filter((r) => matchWhen(r.when, ctx))
    .map((r) => ({ id: r.id, label: r.label, icon: r.icon }));
}
