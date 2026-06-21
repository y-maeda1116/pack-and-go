import { describe, expect, it } from 'vitest';
import type { GenerationInput, Member } from '../src/types';
import {
  buildContext,
  generateItems,
  generateRouteNotes,
  matchWhen,
  type EvalContext,
} from '../src/logic/evaluate';
import { buildSharingPlan } from '../src/logic/plan';
import { ITEM_RULES } from '../src/data/itemRules';
import { ROUTE_NOTE_RULES } from '../src/data/routeNotes';

const TODAY = new Date(2025, 5, 20); // 2025-06-20

const adult = (id: string, name = '親'): Member => ({ id, type: 'adult', name });
// 5ヶ月(infant) / 17ヶ月(toddler) / 48ヶ月(preschool) / 101ヶ月(school)
const infant = (id = 'c-inf'): Member => ({ id, type: 'child', name: '赤', birthDate: '2025-01-01' });
const toddler = (id = 'c-tod'): Member => ({ id, type: 'child', name: '幼', birthDate: '2024-01-15' });
const preschool = (id = 'c-pre'): Member => ({ id, type: 'child', name: '児', birthDate: '2021-06-10' });
const school = (id = 'c-sch'): Member => ({ id, type: 'child', name: '学', birthDate: '2017-01-01' });

const input = (over: Partial<GenerationInput> = {}): GenerationInput => ({
  selectedMemberIds: [],
  destination: 'park',
  hours: 4,
  flags: [],
  ...over,
});

const ctx = (members: Member[], over: Partial<GenerationInput> = {}): EvalContext =>
  buildContext(members, input({ selectedMemberIds: members.map((m) => m.id), ...over }), TODAY);

describe('buildContext: 年齢バンド導出', () => {
  it('生年月日からバンドを導出する', () => {
    const c = ctx([infant(), toddler(), preschool(), school()]);
    const bands = c.children.map((ch) => ch.band);
    expect(bands).toEqual(['infant', 'toddler', 'preschool', 'school']);
  });

  it('選択されたメンバーだけを対象にする', () => {
    const members = [adult('a1'), infant('c1'), toddler('c2')];
    const c = buildContext(members, input({ selectedMemberIds: ['a1', 'c1'] }), TODAY);
    expect(c.adults).toHaveLength(1);
    expect(c.children).toHaveLength(1);
    expect(c.children[0]?.band).toBe('infant');
  });

  it('usesStroller の子どもがいれば stroller フラグを自動付与', () => {
    const c = buildContext(
      [{ id: 'c1', type: 'child', name: '赤', birthDate: '2025-01-01', usesStroller: true }],
      input({ selectedMemberIds: ['c1'] }),
      TODAY,
    );
    expect(c.flags.has('stroller')).toBe(true);
  });
});

describe('buildContext: モード導出', () => {
  it('大人1+子ども1以上 は solo-parent', () => {
    expect(ctx([adult('a1'), infant()]).mode).toBe('solo-parent');
  });
  it('大人2以上 は multi-adult（子どもがいても優先）', () => {
    expect(ctx([adult('a1'), adult('a2'), infant()]).mode).toBe('multi-adult');
  });
  it('大人1名のみは null、大人2名（子どもなし）は multi-adult', () => {
    expect(ctx([adult('a1')]).mode).toBe(null);
    expect(ctx([adult('a1'), adult('a2')]).mode).toBe('multi-adult');
  });
});

describe('matchWhen', () => {
  it('空の条件は常にマッチ', () => {
    expect(matchWhen({}, ctx([adult('a1')]))).toBe(true);
  });
  it('childBand が存在しなければ不一致', () => {
    expect(matchWhen({ childBand: ['infant'] }, ctx([school()]))).toBe(false);
  });
  it('destinations が一致しなければ不一致', () => {
    expect(matchWhen({ destinations: ['seaside'] }, ctx([adult('a1')], { destination: 'park' }))).toBe(false);
  });
  it('minHours を下回れば不一致', () => {
    expect(matchWhen({ minHours: 4 }, ctx([adult('a1')], { hours: 3 }))).toBe(false);
  });
  it('mode が一致しなければ不一致', () => {
    expect(matchWhen({ mode: ['solo-parent'] }, ctx([adult('a1'), adult('a2')]))).toBe(false);
  });
});

describe('generateItems: スコープと個数', () => {
  it('per-child は子どもごとに1行生成（2人で2行）', () => {
    const items = generateItems(ITEM_RULES, ctx([infant(), toddler()]));
    const diaperRows = items.filter((i) => i.ruleId === 'diapers');
    expect(diaperRows).toHaveLength(2);
  });

  it('per-adult は大人ごとに1行生成', () => {
    const items = generateItems(ITEM_RULES, ctx([adult('a1', 'パパ'), adult('a2', 'ママ')]));
    const bottles = items.filter((i) => i.ruleId === 'water-bottle');
    expect(bottles).toHaveLength(2);
    expect(bottles.map((b) => b.owner).sort()).toEqual(['パパ', 'ママ']);
  });

  it('qty が時間から計算される（オムツ @4h → 4枚）', () => {
    const items = generateItems(ITEM_RULES, ctx([infant()], { hours: 4 }));
    const diaper = items.find((i) => i.ruleId === 'diapers');
    expect(diaper?.note).toBe('4枚');
  });

  it('qty が時間から計算される（オムツ @5h → 5枚）', () => {
    const items = generateItems(ITEM_RULES, ctx([infant()], { hours: 5 }));
    const diaper = items.find((i) => i.ruleId === 'diapers');
    expect(diaper?.note).toBe('5枚');
  });

  it('minHours 未満ではオムツが生成されない', () => {
    const items = generateItems(ITEM_RULES, ctx([infant()], { hours: 0 }));
    expect(items.some((i) => i.ruleId === 'diapers')).toBe(false);
  });
});

describe('generateItems: モード連動', () => {
  it('solo-parent では リュック が必須アイテムに現れる', () => {
    const items = generateItems(ITEM_RULES, ctx([adult('a1'), infant()]));
    expect(items.some((i) => i.ruleId === 'backpack')).toBe(true);
    expect(items.some((i) => i.ruleId === 'baby-carrier')).toBe(true);
  });

  it('multi-adult（大人のみ）では リュック は現れない', () => {
    const items = generateItems(ITEM_RULES, ctx([adult('a1'), adult('a2')]));
    expect(items.some((i) => i.ruleId === 'backpack')).toBe(false);
  });
});

describe('generateItems: 行き先連動', () => {
  it('海では水着・虫よけが現れる', () => {
    const items = generateItems(ITEM_RULES, ctx([preschool()], { destination: 'seaside' }));
    expect(items.some((i) => i.ruleId === 'swimwear')).toBe(true);
    expect(items.some((i) => i.ruleId === 'insect-repellent')).toBe(true);
  });

  it('屋内では虫よけが出ず、冷房対策の上着が出る', () => {
    const items = generateItems(ITEM_RULES, ctx([adult('a1')], { destination: 'indoor' }));
    expect(items.some((i) => i.ruleId === 'insect-repellent')).toBe(false);
    expect(items.some((i) => i.ruleId === 'extra-layer')).toBe(true);
  });
});

describe('generateItems: バンド切り替え', () => {
  it('preschool では おやつ が出て オムツ は出ない', () => {
    const items = generateItems(ITEM_RULES, ctx([preschool()]));
    expect(items.some((i) => i.ruleId === 'snack')).toBe(true);
    expect(items.some((i) => i.ruleId === 'diapers')).toBe(false);
  });
  it('school では おやつ と タオル が出る', () => {
    const items = generateItems(ITEM_RULES, ctx([school()]));
    expect(items.some((i) => i.ruleId === 'snack')).toBe(true);
    expect(items.some((i) => i.ruleId === 'towel')).toBe(true);
  });
});

describe('generateRouteNotes', () => {
  it('ベビーカー利用でエレベータールートが表示される', () => {
    const notes = generateRouteNotes(
      ROUTE_NOTE_RULES,
      ctx([adult('a1')], { flags: ['stroller'] }),
    );
    expect(notes.some((n) => n.id === 'elevator-route')).toBe(true);
  });

  it('乳幼児同伴で多目的トイレが表示される', () => {
    const notes = generateRouteNotes(ROUTE_NOTE_RULES, ctx([infant()]));
    expect(notes.some((n) => n.id === 'multipurpose-toilet')).toBe(true);
  });

  it('学童のみ・フラグなしなら動線メモは出ない', () => {
    const notes = generateRouteNotes(ROUTE_NOTE_RULES, ctx([school()], { destination: 'indoor' }));
    expect(notes).toHaveLength(0);
  });
});

describe('buildSharingPlan', () => {
  it('multi-adult で2ロールの分担案を生成', () => {
    const c = ctx([adult('a1', 'パパ'), adult('a2', 'ママ'), toddler()]);
    const items = generateItems(ITEM_RULES, c);
    const plan = buildSharingPlan(c, items);
    expect(plan).not.toBeNull();
    expect(plan?.roles).toHaveLength(2);
    expect(plan?.roles.map((r) => r.carrier).sort()).toEqual(['パパ', 'ママ']);
  });

  it('solo-parent では分担案は null', () => {
    const c = ctx([adult('a1'), infant()]);
    const items = generateItems(ITEM_RULES, c);
    expect(buildSharingPlan(c, items)).toBeNull();
  });

  it('大人2名のみでも分担案を生成する（共通品を2つに分割）', () => {
    const c = ctx([adult('a1'), adult('a2')]);
    const items = generateItems(ITEM_RULES, c);
    const plan = buildSharingPlan(c, items);
    expect(plan).not.toBeNull();
    expect(plan?.roles).toHaveLength(2);
  });
});
