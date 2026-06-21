/** UI 構築用ヘルパ。innerHTML を使わず、DOM API で安全に要素を組み立てる（XSS 耐性）。 */

export type Child = Node | string | null | undefined | false;

export interface HOptions {
  readonly className?: string;
  readonly attrs?: Readonly<Record<string, string>>;
  readonly text?: string;
  readonly onClick?: () => void;
}

/** 要素を生成する hyperscript 風ヘルパ。文字列は textNode として安全に挿入。 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts: HOptions = {},
  children: readonly Child[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (opts.className) el.className = opts.className;
  if (opts.text !== undefined) el.textContent = opts.text;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) el.setAttribute(k, v);
  }
  if (opts.onClick) el.addEventListener('click', opts.onClick);
  for (const c of children) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** div のショートカット。 */
export function div(className: string | undefined, children: readonly Child[] = []): HTMLDivElement {
  return h('div', { className }, children);
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** 共通スタイルのボタン。 */
export function button(
  label: string,
  onClick: () => void,
  variant: ButtonVariant = 'primary',
): HTMLButtonElement {
  const base =
    'rounded-xl px-4 py-3 font-semibold text-base transition active:scale-[.99] disabled:opacity-40 w-full';
  const styles: Readonly<Record<ButtonVariant, string>> = Object.freeze({
    primary: 'bg-teal-600 text-white shadow-sm',
    secondary: 'bg-white text-teal-700 border border-teal-200',
    ghost: 'bg-transparent text-slate-500',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200',
  });
  return h('button', { className: `${base} ${styles[variant] ?? styles.primary}`, text: label, onClick });
}

/** カード枠。 */
export function card(children: readonly Child[]): HTMLDivElement {
  return div('rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 p-4 space-y-3', children);
}

/** セクション見出し（バッジ付き可）。 */
export function sectionTitle(text: string, badge?: string): HTMLHeadingElement {
  return h('h2', { className: 'text-sm font-bold text-slate-500 uppercase tracking-wide' }, [
    document.createTextNode(text),
    ...(badge
      ? [
          h('span', {
            className: 'ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 align-middle',
            text: badge,
          }),
        ]
      : []),
  ]);
}
