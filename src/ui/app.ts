import { actions, getState, subscribe } from '../state/store';
import type { Tab } from '../state/store';
import { h } from './components';
import { renderGenerate } from './generateScreen';
import { renderMembers } from './membersScreen';
import { renderResult } from './resultScreen';

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: string }> = [
  { id: 'members', label: 'メンバー', icon: '👤' },
  { id: 'generate', label: '持ち物を作る', icon: '🎒' },
  { id: 'result', label: 'リスト', icon: '✅' },
];

function buildHeader(): HTMLElement {
  return h('header', {
    className:
      'sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur',
  }, [
    h('h1', { className: 'text-lg font-bold text-teal-700', text: '🎒 パックアンドゴー' }),
    h('p', { className: 'text-xs text-slate-500', text: 'お出かけ持ち物リスト' }),
  ]);
}

function buildTabBar(current: Tab): HTMLElement {
  const tabs = TABS.map((t) => {
    const active = t.id === current;
    return h('button', {
      className: `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
        active ? 'text-teal-700' : 'text-slate-400'
      }`,
      onClick: () => actions.setTab(t.id),
    }, [
      h('span', { className: 'text-base', text: t.icon }),
      h('span', { text: t.label }),
    ]);
  });
  return h('nav', {
    className:
      'pb-safe fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white/95 backdrop-blur',
  }, tabs);
}

function renderMain(): HTMLElement {
  const { tab } = getState();
  const main = h('main', { className: 'mx-auto w-full max-w-md px-4 pb-28 pt-4' });
  if (tab === 'members') main.append(renderMembers());
  else if (tab === 'generate') main.append(renderGenerate());
  else main.append(renderResult());
  return main;
}

export function mountApp(root: HTMLElement): void {
  const paint = () => {
    root.replaceChildren(buildHeader(), renderMain(), buildTabBar(getState().tab));
  };
  subscribe(paint);
  paint();
}
