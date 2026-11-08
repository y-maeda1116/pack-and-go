import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '../src/state/storage';
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
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

/** setItem で必ず例外を投げるスタブ（クォータ超過・ストレージ無効のシミュレーション）。 */
class ThrowingStorage {
  getItem(): string | null {
    throw new Error('unavailable');
  }
  setItem(): void {
    throw new Error('unavailable');
  }
}

const adult: Member = { id: 'a1', type: 'adult', name: 'パパ' };
const child: Member = {
  id: 'c1',
  type: 'child',
  name: 'はるく',
  birthDate: '2024-03-15',
  usesStroller: true,
  usesDiapers: false,
};
const input: GenerationInput = {
  selectedMemberIds: ['a1', 'c1'],
  destination: 'park',
  hours: 3,
  flags: ['stroller'],
};

describe('storage', () => {
  let memory: MemoryStorage;

  beforeEach(() => {
    memory = new MemoryStorage();
    vi.stubGlobal('localStorage', memory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('members を保存して読み込める（ラウンドトリップ）', () => {
    storage.saveMembers([adult, child]);
    expect(storage.loadMembers()).toEqual([adult, child]);
  });

  it('未保存時は loadMembers が空配列を返す', () => {
    expect(storage.loadMembers()).toEqual([]);
  });

  it('input を保存して読み込める', () => {
    storage.saveInput(input);
    expect(storage.loadInput()).toEqual(input);
  });

  it('未保存時は loadInput が null を返す', () => {
    expect(storage.loadInput()).toBeNull();
  });

  it('checks を保存して読み込める', () => {
    const checks = { 'item-1': true, 'item-2': false };
    storage.saveChecks(checks);
    expect(storage.loadChecks()).toEqual(checks);
  });

  it('未保存時は loadChecks が空オブジェクトを返す', () => {
    expect(storage.loadChecks()).toEqual({});
  });

  it('壊れた JSON はフォールバック値を返す', () => {
    memory.setItem('pag.members.v1', '{broken json');
    expect(storage.loadMembers()).toEqual([]);
    memory.setItem('pag.input.v1', 'not json');
    expect(storage.loadInput()).toBeNull();
  });

  it('ストレージが例外を投げても読み書きは握りつぶされる', () => {
    vi.stubGlobal('localStorage', new ThrowingStorage());
    expect(storage.loadMembers()).toEqual([]);
    expect(storage.loadInput()).toBeNull();
    expect(storage.loadChecks()).toEqual({});
    expect(() => storage.saveMembers([adult])).not.toThrow();
    expect(() => storage.saveInput(input)).not.toThrow();
    expect(() => storage.saveChecks({ a: true })).not.toThrow();
  });
});
