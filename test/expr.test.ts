import { describe, expect, it } from 'vitest';
import { evaluateExpr, formatQty } from '../src/logic/expr';

describe('evaluateExpr', () => {
  it('四則演算', () => {
    expect(evaluateExpr('1 + 2', 0)).toBe(3);
    expect(evaluateExpr('10 - 4', 0)).toBe(6);
    expect(evaluateExpr('3 * 4', 0)).toBe(12);
    expect(evaluateExpr('10 / 4', 0)).toBe(2.5);
  });

  it('演算子優先順位', () => {
    expect(evaluateExpr('2 + 3 * 4', 0)).toBe(14);
    expect(evaluateExpr('(2 + 3) * 4', 0)).toBe(20);
  });

  it('hours 変数', () => {
    expect(evaluateExpr('hours', 4)).toBe(4);
    expect(evaluateExpr('hours * 2', 3)).toBe(6);
  });

  it('ceil / floor', () => {
    expect(evaluateExpr('ceil(hours / 2)', 4)).toBe(2);
    expect(evaluateExpr('ceil(hours / 2)', 5)).toBe(3);
    expect(evaluateExpr('floor(hours / 4)', 7)).toBe(1);
  });

  it('オムツ個数の実式: ceil(hours/2)+2', () => {
    expect(evaluateExpr('ceil(hours / 2) + 2', 4)).toBe(4);
    expect(evaluateExpr('ceil(hours / 2) + 2', 5)).toBe(5);
  });

  it('着替え実式: max なし floor(hours/4)', () => {
    expect(evaluateExpr('floor(hours / 4)', 8)).toBe(2);
    expect(evaluateExpr('floor(hours / 4)', 3)).toBe(0);
  });

  it('単項マイナス', () => {
    expect(evaluateExpr('-2 + 5', 0)).toBe(3);
    expect(evaluateExpr('-(hours)', 4)).toBe(-4);
  });

  it('未知の識別子は例外', () => {
    expect(() => evaluateExpr('foo + 1', 0)).toThrow();
  });

  it('空文字列は例外', () => {
    expect(() => evaluateExpr('', 0)).toThrow();
  });

  it('ゼロ除算は0を返す（安全化）', () => {
    expect(evaluateExpr('hours / 0', 4)).toBe(0);
  });
});

describe('formatQty', () => {
  it('{n} を計算結果で置換', () => {
    expect(formatQty('{n}枚', 4)).toBe('4枚');
    expect(formatQty('{n}セット', 2)).toBe('2セット');
  });

  it('{n} が無ければそのまま', () => {
    expect(formatQty('1セット', 5)).toBe('1セット');
  });
});
