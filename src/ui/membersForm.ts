import type { Member, MemberType } from '../types';
import { actions } from '../state/store';
import { button, card, h, sectionTitle, type Child } from './components';

interface Draft {
  name: string;
  type: MemberType;
  year: number;
  month: number;
  day: number;
  stroller: boolean;
  diapers: boolean;
}

function currentYear(): number {
  return new Date().getFullYear();
}

function emptyDraft(): Draft {
  return { name: '', type: 'adult', year: currentYear(), month: 1, day: 1, stroller: false, diapers: false };
}

let editingId: string | null = null;
let draft: Draft = emptyDraft();
let requestRepaint: () => void = () => {};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildBirthDate(d: Draft): string {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}

function isValidBirthDate(d: Draft): boolean {
  const date = new Date(d.year, d.month - 1, d.day);
  if (
    date.getFullYear() !== d.year ||
    date.getMonth() !== d.month - 1 ||
    date.getDate() !== d.day
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() <= today.getTime();
}

export function startEdit(member: Member): void {
  editingId = member.id;
  if (member.type === 'child' && member.birthDate) {
    const [y, m, dd] = member.birthDate.split('-').map(Number);
    draft = {
      name: member.name,
      type: 'child',
      year: y,
      month: m,
      day: dd,
      stroller: member.usesStroller ?? false,
      diapers: member.usesDiapers ?? false,
    };
  } else {
    draft = { ...emptyDraft(), name: member.name, type: member.type };
  }
  requestRepaint();
}

function cancelEdit(): void {
  editingId = null;
  draft = emptyDraft();
  requestRepaint();
}

function saveDraft(): void {
  const name = draft.name.trim();
  if (!name) {
    alert('名前を入力してください');
    return;
  }
  if (draft.type === 'child' && !isValidBirthDate(draft)) {
    alert('生年月日が不正、または未来日です');
    return;
  }
  const base = {
    id: editingId ?? crypto.randomUUID(),
    name,
    type: draft.type,
  };
  const member: Member =
    draft.type === 'child'
      ? {
          ...base,
          birthDate: buildBirthDate(draft),
          usesStroller: draft.stroller,
          usesDiapers: draft.diapers,
        }
      : base;

  if (editingId) actions.updateMember(member);
  else actions.addMember(member);

  editingId = null;
  draft = emptyDraft();
}

function selectField(
  options: readonly { value: string; label: string }[],
  current: string,
  onChange: (v: string) => void,
): HTMLSelectElement {
  const sel = h('select', {
    className: 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base',
  });
  for (const o of options) {
    sel.append(h('option', { attrs: { value: o.value }, text: o.label }));
  }
  sel.value = current;
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function typeToggle(): HTMLElement {
  const mk = (value: MemberType, label: string): HTMLButtonElement =>
    h('button', {
      className: `flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        draft.type === value ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
      }`,
      text: label,
      onClick: () => {
        draft = { ...draft, type: value };
        requestRepaint();
      },
    });
  return h('div', { className: 'flex gap-2' }, [mk('adult', '大人'), mk('child', '子ども')]);
}

function birthFields(): HTMLElement {
  const years: { value: string; label: string }[] = [];
  for (let y = currentYear(); y >= currentYear() - 18; y--) {
    years.push({ value: String(y), label: `${y}年` });
  }
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}月`,
  }));
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}日`,
  }));
  const checkbox = (checked: boolean, label: string, onChange: (v: boolean) => void): HTMLLabelElement => {
    const input = h('input', { attrs: { type: 'checkbox' } });
    input.checked = checked;
    input.className = 'h-4 w-4 accent-teal-600';
    input.addEventListener('change', () => onChange(input.checked));
    return h('label', { className: 'flex items-center gap-2 text-sm' }, [input, document.createTextNode(label)]);
  };
  return h('div', { className: 'space-y-3' }, [
    h('label', { className: 'block text-xs font-medium text-slate-500', text: '生年月日' }),
    h('div', { className: 'flex gap-2' }, [
      selectField(years, String(draft.year), (v) => {
        draft = { ...draft, year: Number(v) };
      }),
      selectField(months, String(draft.month), (v) => {
        draft = { ...draft, month: Number(v) };
      }),
      selectField(days, String(draft.day), (v) => {
        draft = { ...draft, day: Number(v) };
      }),
    ]),
    h('div', { className: 'flex flex-wrap gap-4 pt-1' }, [
      checkbox(draft.stroller, 'ベビーカーを使うことがある', (v) => {
        draft = { ...draft, stroller: v };
      }),
      checkbox(draft.diapers, 'オムツを使用中', (v) => {
        draft = { ...draft, diapers: v };
      }),
    ]),
  ]);
}

function formSection(): HTMLElement {
  const nameInput = h('input', {
    className: 'w-full rounded-xl border border-slate-200 px-3 py-2 text-base',
    attrs: { type: 'text', placeholder: '名前（例: パパ・はるく）', maxlength: '20' },
  });
  nameInput.value = draft.name;
  nameInput.addEventListener('input', () => {
    draft = { ...draft, name: nameInput.value };
  });

  const children: Child[] = [
    sectionTitle(editingId ? 'メンバーを編集' : 'メンバーを追加'),
    nameInput,
    typeToggle(),
  ];
  if (draft.type === 'child') children.push(birthFields());

  children.push(
    h('div', { className: 'flex gap-2 pt-1' }, [
      button(editingId ? '更新する' : '追加する', () => saveDraft(), 'primary'),
      ...(editingId
        ? [button('キャンセル', () => cancelEdit(), 'secondary')]
        : []),
    ]),
  );
  return card(children);
}

export function renderMembersForm(onRepaint: () => void): HTMLElement {
  requestRepaint = onRepaint;
  return formSection();
}
