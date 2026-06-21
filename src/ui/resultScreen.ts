import type { ItemCategory } from '../types';
import { ITEM_RULES } from '../data/itemRules';
import { ROUTE_NOTE_RULES } from '../data/routeNotes';
import { destinationLabel } from '../data/destinations';
import {
  buildContext,
  generateItems,
  generateRouteNotes,
  type GeneratedItem,
} from '../logic/evaluate';
import { buildSharingPlan } from '../logic/plan';
import { actions, getState } from '../state/store';
import { button, card, div, h, sectionTitle, type Child } from './components';

const CATEGORY_ORDER: readonly ItemCategory[] = ['mode', 'baby', 'food', 'common', 'destination'];
const CATEGORY_LABEL: Readonly<Record<ItemCategory, string>> = Object.freeze({
  mode: '🧭 準備のポイント',
  baby: '🍼 乳幼児ケア',
  food: '🍱 食事・飲み物',
  common: '🎒 共通',
  destination: '📍 行き先別',
});

function emptyState(): HTMLElement {
  return card([
    h('p', { className: 'text-sm text-slate-500', text: 'まだ持ち物リストが作成されていません。' }),
    h('div', {}, [
      button('持ち物を作る画面へ', () => actions.setTab('generate'), 'primary'),
    ]),
  ]);
}

function routeNotesSection(notes: readonly { id: string; label: string; icon: string }[]): HTMLElement | null {
  if (notes.length === 0) return null;
  const rows = notes.map((n) =>
    h('div', { className: 'flex items-center gap-2' }, [
      h('span', { className: 'text-lg', text: n.icon }),
      h('span', { className: 'text-sm', text: n.label }),
    ]),
  );
  return h('div', {
    className: 'rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 space-y-2',
  }, [
    h('div', { className: 'flex items-center gap-1 text-sm font-bold text-amber-800' }, [
      h('span', { text: '📌' }),
      document.createTextNode('動線メモ（現地で確認）'),
    ]),
    ...rows,
  ]);
}

function modeBanner(ctx: ReturnType<typeof buildContext>): HTMLElement | null {
  if (ctx.mode === 'solo-parent') {
    return h('div', { className: 'rounded-2xl bg-teal-50 ring-1 ring-teal-200 p-4 space-y-1' }, [
      h('div', { className: 'text-sm font-bold text-teal-800', text: '🎒 ワンオペモード' }),
      h('p', {
        className: 'text-sm text-teal-700',
        text: '両手を空けるためリュックを必須に。子どもが小さければ抱っこ紐も検討しましょう。',
      }),
    ]);
  }
  if (ctx.mode === 'multi-adult') {
    return null; // 分担案は別セクションで表示
  }
  return null;
}

function sharingSection(
  plan: ReturnType<typeof buildSharingPlan>,
): HTMLElement | null {
  if (!plan) return null;
  const roles = plan.roles.map((r) => {
    const desc = r.items.length > 0 ? r.items.join('・') : '（対象アイテムなし）';
    return h('div', { className: 'space-y-1' }, [
      h('div', { className: 'text-sm font-semibold text-slate-700', text: `${r.carrier}：${r.bag}` }),
      h('div', { className: 'text-xs text-slate-500', text: desc }),
    ]);
  });
  return h('div', { className: 'rounded-2xl bg-teal-50 ring-1 ring-teal-200 p-4 space-y-3' }, [
    h('div', { className: 'text-sm font-bold text-teal-800', text: '👥 荷物分担案' }),
    h('p', { className: 'text-sm text-teal-700', text: plan.summary }),
    ...roles,
  ]);
}

function itemRow(item: GeneratedItem, checked: boolean): HTMLElement {
  const checkbox = h('input', { attrs: { type: 'checkbox' } });
  checkbox.checked = checked;
  checkbox.className = 'h-5 w-5 accent-teal-600';
  checkbox.addEventListener('change', () => actions.toggleCheck(item.id));
  const labelChildren: Child[] = [document.createTextNode(item.label)];
  if (item.note) {
    labelChildren.push(
      h('span', { className: 'ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600', text: item.note }),
    );
  }
  const left = h('div', { className: 'min-w-0' }, [
    h('div', { className: 'flex flex-wrap items-center gap-1' }, labelChildren),
    ...(item.owner ? [h('div', { className: 'text-xs text-slate-400', text: `担当: ${item.owner}` })] : []),
  ]);
  return h('label', {
    className: `flex items-start gap-3 rounded-xl px-2 py-2 transition ${
      checked ? 'opacity-50' : ''
    }`,
  }, [checkbox, left]);
}

function itemSections(items: readonly GeneratedItem[]): HTMLElement[] {
  const byCat = new Map<ItemCategory, GeneratedItem[]>();
  for (const it of items) {
    const list = byCat.get(it.category) ?? [];
    list.push(it);
    byCat.set(it.category, list);
  }
  const sections: HTMLElement[] = [];
  for (const cat of CATEGORY_ORDER) {
    const list = byCat.get(cat);
    if (!list || list.length === 0) continue;
    sections.push(
      card([
        sectionTitle(CATEGORY_LABEL[cat], `${list.length}`),
        ...list.map((it) => itemRow(it, !!getState().checks[it.id])),
      ]),
    );
  }
  return sections;
}

export function renderResult(): HTMLElement {
  const { input } = getState();
  const root = div('space-y-4');
  if (!input) {
    root.append(emptyState());
    return root;
  }

  const ctx = buildContext(getState().members, input, new Date());
  const items = generateItems(ITEM_RULES, ctx);
  const notes = generateRouteNotes(ROUTE_NOTE_RULES, ctx);
  const plan = buildSharingPlan(ctx, items);
  const total = items.length;
  const done = items.filter((it) => getState().checks[it.id]).length;

  const header = card([
    h('div', { className: 'flex items-center justify-between' }, [
      h('div', { className: 'text-sm text-slate-500', text: `${destinationLabel(input.destination)} ・ ${input.hours}時間` }),
      h('div', { className: 'text-sm font-semibold text-teal-700', text: `${done}/${total} 完了` }),
    ]),
    h('div', { className: 'flex gap-2' }, [
      button('リストを作り直す', () => actions.setTab('generate'), 'secondary'),
      button('チェックを全解除', () => actions.clearChecks(), 'ghost'),
    ]),
  ]);
  root.append(header);

  const pin = routeNotesSection(notes);
  if (pin) root.append(pin);

  const banner = modeBanner(ctx);
  if (banner) root.append(banner);

  const sharing = sharingSection(plan);
  if (sharing) root.append(sharing);

  const sections = itemSections(items);
  if (sections.length === 0) {
    root.append(
      card([
        h('p', { className: 'text-sm text-slate-500', text: '該当する持ち物がありません。条件を見直してください。' }),
      ]),
    );
  } else {
    root.append(...sections);
  }
  return root;
}
