import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerationInput, Member } from '../src/types';

/** localStorage のインメモリスタブ（node 環境で DOM を使わず再現）。 */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const adult: Member = { id: 'a1', type: 'adult', name: 'パパ' };
const child: Member = { id: 'c1', type: 'child', name: 'はるく', birthDate: '2024-03-15' };
const input: GenerationInput = {
  selectedMemberIds: ['a1'],
  destination: 'park',
  hours: 2,
  flags: [],
};

let memory: MemoryStorage;

/** store はモジュール読み込み時に storage から初期化するため、毎テストで再読み込みする。 */
async function loadStore() {
  vi.resetModules();
  return await import('../src/state/store');
}

function seed(key: string, value: unknown): void {
  memory.setItem(key, JSON.stringify(value));
}

describe('store', () => {
  beforeEach(() => {
    memory = new MemoryStorage();
    vi.stubGlobal('localStorage', memory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('モジュール読み込み時に localStorage から状態を復元する', async () => {
    seed('pag.members.v1', [adult]);
    seed('pag.input.v1', input);
    seed('pag.checks.v1', { 'item-1': true });
    const { getState } = await loadStore();
    const state = getState();
    expect(state.members).toEqual([adult]);
    expect(state.input).toEqual(input);
    expect(state.checks).toEqual({ 'item-1': true });
    expect(state.tab).toBe('generate');
  });

  it('addMember は追記し永続化する（既存配列は変更しない）', async () => {
    const { actions, getState } = await loadStore();
    const before = getState();
    actions.addMember(adult);
    actions.addMember(child);
    const after = getState();
    expect(after.members).toEqual([adult, child]);
    expect(before.members).toEqual([]);
    expect(JSON.parse(memory.getItem('pag.members.v1') ?? 'null')).toEqual([adult, child]);
  });

  it('updateMember は同一 id を置き換える', async () => {
    seed('pag.members.v1', [adult, child]);
    const { actions, getState } = await loadStore();
    const renamed: Member = { ...adult, name: 'ママ' };
    actions.updateMember(renamed);
    expect(getState().members).toEqual([renamed, child]);
    expect(JSON.parse(memory.getItem('pag.members.v1') ?? 'null')).toEqual([renamed, child]);
  });

  it('removeMember は指定 id を取り除く', async () => {
    seed('pag.members.v1', [adult, child]);
    const { actions, getState } = await loadStore();
    actions.removeMember('a1');
    expect(getState().members).toEqual([child]);
    expect(JSON.parse(memory.getItem('pag.members.v1') ?? 'null')).toEqual([child]);
  });

  it('setInput は checks をリセットし両方を永続化する', async () => {
    seed('pag.checks.v1', { 'item-1': true });
    const { actions, getState } = await loadStore();
    actions.setInput(input);
    const state = getState();
    expect(state.input).toEqual(input);
    expect(state.checks).toEqual({});
    expect(JSON.parse(memory.getItem('pag.input.v1') ?? 'null')).toEqual(input);
    expect(JSON.parse(memory.getItem('pag.checks.v1') ?? 'null')).toEqual({});
  });

  it('toggleCheck はトグルし、clearChecks は空にする', async () => {
    const { actions, getState } = await loadStore();
    actions.toggleCheck('item-1');
    expect(getState().checks).toEqual({ 'item-1': true });
    actions.toggleCheck('item-1');
    expect(getState().checks).toEqual({ 'item-1': false });
    actions.clearChecks();
    expect(getState().checks).toEqual({});
    expect(JSON.parse(memory.getItem('pag.checks.v1') ?? 'null')).toEqual({});
  });

  it('setTab はタブを切り替える', async () => {
    const { actions, getState } = await loadStore();
    actions.setTab('members');
    expect(getState().tab).toBe('members');
    actions.setTab('result');
    expect(getState().tab).toBe('result');
  });

  it('subscribe のリスナーは状態変更で呼ばれ、解除すると呼ばれない', async () => {
    const { actions, subscribe } = await loadStore();
    const calls: number[] = [];
    const unsubscribe = subscribe((state) => calls.push(state.members.length));
    actions.addMember(adult);
    unsubscribe();
    actions.addMember(child);
    expect(calls).toEqual([1]);
  });
});
