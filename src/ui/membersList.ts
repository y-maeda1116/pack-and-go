import type { Member } from '../types';
import { BAND_LABEL, BAND_MODE_LABEL, ageMonthsBetween, bandForMonths, formatAge } from '../logic/age';
import { actions, getState } from '../state/store';
import { card, h, sectionTitle, type Child } from './components';

function deleteMember(member: Member): void {
  if (confirm(`${member.name} を削除しますか？`)) {
    actions.removeMember(member.id);
  }
}

function memberCard(member: Member, onEdit: (member: Member) => void): HTMLElement {
  const today = new Date();
  let subtitle: string;
  let modeLine: Child[] = [];
  if (member.type === 'adult') {
    subtitle = '大人';
  } else {
    const months = member.birthDate ? ageMonthsBetween(member.birthDate, today) : 0;
    const band = bandForMonths(months);
    subtitle = `${formatAge(months)}・${BAND_LABEL[band]}`;
    modeLine = [h('div', { className: 'text-xs text-teal-700', text: BAND_MODE_LABEL[band] })];
  }
  return h('div', { className: 'flex items-center gap-3' }, [
    h('div', { className: 'flex-1 min-w-0' }, [
      h('div', { className: 'truncate font-semibold', text: member.name }),
      h('div', { className: 'text-xs text-slate-500', text: subtitle }),
      ...modeLine,
    ]),
    h('button', {
      className: 'shrink-0 rounded-lg px-2 py-1 text-xs text-teal-700',
      text: '編集',
      onClick: () => onEdit(member),
    }),
    h('button', {
      className: 'shrink-0 rounded-lg px-2 py-1 text-xs text-rose-600',
      text: '削除',
      onClick: () => deleteMember(member),
    }),
  ]);
}

export function renderMembersList(onEdit: (member: Member) => void): HTMLElement {
  const { members } = getState();
  const children: Child[] = [];
  if (members.length === 0) {
    children.push(
      h('p', {
        className: 'text-sm text-slate-500',
        text: 'まだメンバーがいません。下のフォームから大人・子どもを登録してください。',
      }),
    );
  } else {
    for (const m of members) children.push(memberCard(m, onEdit));
  }
  return card([sectionTitle('登録済みメンバー', `${members.length}名`), ...children]);
}
