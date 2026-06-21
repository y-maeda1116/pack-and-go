import { describe, expect, it } from 'vitest';
import {
  ageMonthsBetween,
  bandForMonths,
  formatAge,
  parseISODate,
} from '../src/logic/age';

describe('parseISODate', () => {
  it('有効な ISO 日付をパースする', () => {
    expect(parseISODate('2024-02-15')).toEqual({ year: 2024, month: 2, day: 15 });
  });

  it('不正なフォーマットは null を返す', () => {
    expect(parseISODate('2024/02/15')).toBeNull();
    expect(parseISODate('2024-2-5')).toBeNull();
    expect(parseISODate('')).toBeNull();
  });

  it('範囲外の月日は null を返す', () => {
    expect(parseISODate('2024-13-01')).toBeNull();
    expect(parseISODate('2024-00-10')).toBeNull();
    expect(parseISODate('2024-01-32')).toBeNull();
  });
});

describe('ageMonthsBetween', () => {
  it('ちょうど1歳は12ヶ月', () => {
    expect(ageMonthsBetween('2024-03-15', new Date(2025, 2, 15))).toBe(12);
  });

  it('誕生日前は月を1つ引く', () => {
    // 2024-03-15 生まれ、2025-03-14（誕生日前）→ 11ヶ月
    expect(ageMonthsBetween('2024-03-15', new Date(2025, 2, 14))).toBe(11);
  });

  it('1歳4ヶ月は16ヶ月', () => {
    expect(ageMonthsBetween('2024-02-15', new Date(2025, 5, 20))).toBe(16);
  });

  it('未来の生年月日は0にクランプ', () => {
    expect(ageMonthsBetween('2099-01-01', new Date(2025, 0, 1))).toBe(0);
  });

  it('不正な生年月日は0', () => {
    expect(ageMonthsBetween('invalid', new Date(2025, 0, 1))).toBe(0);
  });
});

describe('bandForMonths', () => {
  it('0-11ヶ月は infant', () => {
    expect(bandForMonths(0)).toBe('infant');
    expect(bandForMonths(11)).toBe('infant');
  });

  it('12-35ヶ月は toddler', () => {
    expect(bandForMonths(12)).toBe('toddler');
    expect(bandForMonths(35)).toBe('toddler');
  });

  it('36-71ヶ月は preschool', () => {
    expect(bandForMonths(36)).toBe('preschool');
    expect(bandForMonths(71)).toBe('preschool');
  });

  it('72ヶ月以上は school', () => {
    expect(bandForMonths(72)).toBe('school');
    expect(bandForMonths(120)).toBe('school');
  });
});

describe('formatAge', () => {
  it('1歳未満はヶ月表示', () => {
    expect(formatAge(8)).toBe('8ヶ月');
  });

  it('0ヶ月', () => {
    expect(formatAge(0)).toBe('0ヶ月');
  });

  it('1歳4ヶ月', () => {
    expect(formatAge(16)).toBe('1歳4ヶ月');
  });

  it('ぴったり3歳（端数なし）', () => {
    expect(formatAge(36)).toBe('3歳');
  });
});
