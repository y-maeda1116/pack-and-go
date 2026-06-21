import type { GenerationInput, Member } from '../types';

/**
 * localStorage の読み書き。バージョン付きキーで破壊的変更に備える。
 * すべての例外は握りつぶし、安全なフォールバック値を返す（ストレージ無効環境でも動く）。
 */

const MEMBERS_KEY = 'pag.members.v1';
const INPUT_KEY = 'pag.input.v1';
const CHECKS_KEY = 'pag.checks.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ストレージ無効・クォータ超過は無視（アプリは動き続ける）
  }
}

export const storage = {
  loadMembers(): Member[] {
    return read<Member[]>(MEMBERS_KEY, []);
  },
  saveMembers(members: readonly Member[]): void {
    write(MEMBERS_KEY, members);
  },

  loadInput(): GenerationInput | null {
    return read<GenerationInput | null>(INPUT_KEY, null);
  },
  saveInput(input: GenerationInput): void {
    write(INPUT_KEY, input);
  },

  loadChecks(): Record<string, boolean> {
    return read<Record<string, boolean>>(CHECKS_KEY, {});
  },
  saveChecks(checks: Record<string, boolean>): void {
    write(CHECKS_KEY, checks);
  },
} as const;
