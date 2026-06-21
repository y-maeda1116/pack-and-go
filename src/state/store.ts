import type { GenerationInput, Member } from '../types';
import { storage } from './storage';

export type Tab = 'members' | 'generate' | 'result';

export interface AppState {
  readonly members: readonly Member[];
  readonly input: GenerationInput | null;
  readonly checks: Record<string, boolean>;
  readonly tab: Tab;
}

type Listener = (state: AppState) => void;

let state: AppState = {
  members: storage.loadMembers(),
  input: storage.loadInput(),
  checks: storage.loadChecks(),
  tab: 'generate',
};

const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function set(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

/** 状態変更アクション群。新しい状態オブジェクトを生成（イミュータブル）し永続化する。 */
export const actions = {
  setTab(tab: Tab): void {
    set({ tab });
  },

  addMember(member: Member): void {
    set({ members: [...state.members, member] });
    storage.saveMembers(state.members);
  },

  updateMember(member: Member): void {
    set({ members: state.members.map((m) => (m.id === member.id ? member : m)) });
    storage.saveMembers(state.members);
  },

  removeMember(id: string): void {
    set({ members: state.members.filter((m) => m.id !== id) });
    storage.saveMembers(state.members);
  },

  setInput(input: GenerationInput): void {
    set({ input, checks: {} });
    storage.saveInput(input);
    storage.saveChecks({});
  },

  toggleCheck(itemId: string): void {
    const checks = { ...state.checks, [itemId]: !state.checks[itemId] };
    set({ checks });
    storage.saveChecks(checks);
  },

  clearChecks(): void {
    set({ checks: {} });
    storage.saveChecks({});
  },
} as const;
