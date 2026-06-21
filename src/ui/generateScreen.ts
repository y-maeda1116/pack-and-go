import type { DestinationId, Flag, GenerationInput, MemberType } from '../types';
import { DESTINATIONS } from '../data/destinations';
import { actions, getState } from '../state/store';
import { button, card, div, h, sectionTitle, type Child } from './components';

interface GenDraft {
  selected: Set<string>;
  destination: DestinationId;
  hours: number;
  flags: Set<Flag>;
}

function initialDraft(): GenDraft {
  const last = getState().input;
  return {
    selected: new Set(last?.selectedMemberIds ?? []),
    destination: last?.destination ?? 'park',
    hours: last?.hours ?? 3,
    flags: new Set(last?.flags ?? []),
  };
}

let draft: GenDraft = initialDraft();
let host: HTMLElement | null = null;

const FLAG_OPTIONS: ReadonlyArray<{ id: Flag; label: string }> = [
  { id: 'stroller', label: '🚼 ベビーカーを利用' },
  { id: 'car', label: '🚗 車で移動' },
  { id: 'night', label: '🌙 夜間に帰宅' },
];

function memberChip(memberId: string, name: string, type: MemberType): HTMLButtonElement {
  const selected = draft.selected.has(memberId);
  const emoji = type === 'adult' ? '🧑' : '👶';
  const btn = h('button', {
    className: `rounded-full px-3 py-2 text-sm font-medium transition border ${
      selected
        ? 'bg-teal-600 text-white border-teal-600'
        : 'bg-white text-slate-600 border-slate-200'
    }`,
    text: `${emoji} ${name}`,
    onClick: () => {
      const next = new Set(draft.selected);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      draft = { ...draft, selected: next };
      repaint();
    },
  });
  return btn;
}

function memberSection(): HTMLElement {
  const { members } = getState();
  const children: Child[] = [];
  if (members.length === 0) {
    children.push(
      h('p', {
        className: 'text-sm text-slate-500',
        text: 'メンバーが未登録です。「メンバー」タブで登録してください。',
      }),
    );
  } else {
    children.push(
      h('div', { className: 'flex flex-wrap gap-2' }, members.map((m) => memberChip(m.id, m.name, m.type))),
    );
  }
  return card([sectionTitle('① 行く人を選んで（複数可）'), ...children]);
}

function destinationSection(): HTMLElement {
  const btns = DESTINATIONS.map((d) => {
    const selected = draft.destination === d.id;
    return h('button', {
      className: `flex-1 rounded-xl px-2 py-3 text-center text-sm font-medium transition border ${
        selected ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
      }`,
      onClick: () => {
        draft = { ...draft, destination: d.id };
        repaint();
      },
    }, [h('div', { className: 'text-xl', text: d.icon }), h('div', { text: d.label })]);
  });
  return card([sectionTitle('② 行き先'), h('div', { className: 'flex flex-wrap gap-2' }, btns)]);
}

function hoursSection(): HTMLElement {
  const valueLabel = h('span', {
    className: 'font-bold text-teal-700',
    text: `${draft.hours} 時間`,
  });
  const range = h('input', {
    className: 'w-full accent-teal-600',
    attrs: { type: 'range', min: '1', max: '12', step: '1', value: String(draft.hours) },
  });
  range.addEventListener('input', () => {
    draft = { ...draft, hours: Number(range.value) };
    valueLabel.textContent = `${draft.hours} 時間`;
  });
  return card([
    sectionTitle('③ 滑在時間'),
    h('div', { className: 'flex items-center justify-between' }, [
      h('span', { className: 'text-xs text-slate-500', text: '1時間' }),
      valueLabel,
      h('span', { className: 'text-xs text-slate-500', text: '12時間' }),
    ]),
    range,
  ]);
}

function flagsSection(): HTMLElement {
  const btns = FLAG_OPTIONS.map((f) => {
    const on = draft.flags.has(f.id);
    return h('button', {
      className: `flex-1 rounded-xl px-2 py-3 text-center text-xs font-medium transition border ${
        on ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
      }`,
      text: f.label,
      onClick: () => {
        const next = new Set(draft.flags);
        if (next.has(f.id)) next.delete(f.id);
        else next.add(f.id);
        draft = { ...draft, flags: next };
        repaint();
      },
    });
  });
  return card([sectionTitle('④ 現地の条件（任意）'), h('div', { className: 'flex gap-2' }, btns)]);
}

function generate(): void {
  if (draft.selected.size === 0) {
    alert('行く人を1名以上選んでください');
    return;
  }
  const input: GenerationInput = {
    selectedMemberIds: [...draft.selected],
    destination: draft.destination,
    hours: draft.hours,
    flags: [...draft.flags],
  };
  actions.setInput(input);
  actions.setTab('result');
}

function repaint(): void {
  if (!host) return;
  host.replaceChildren(
    memberSection(),
    destinationSection(),
    hoursSection(),
    flagsSection(),
    h('div', { className: 'pt-2' }, [button('▶ 持ち物リストを作成', generate, 'primary')]),
  );
}

export function renderGenerate(): HTMLElement {
  host = div('space-y-4');
  repaint();
  return host;
}
