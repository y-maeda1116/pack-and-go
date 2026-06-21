import type { ItemRule } from '../types';

/**
 * 持ち物ルールマスター。
 * `when` を満たすコンテキストでのみ発火する。データ追加だけで拡張可能（コード変更不要）。
 * `when: {}` は常に発火（ベース常備品）。
 */
export const ITEM_RULES: readonly ItemRule[] = [
  // ---- 乳幼児ケア（baby）----
  {
    id: 'diapers',
    label: 'オムツ',
    category: 'baby',
    scope: 'per-child',
    when: { childBand: ['infant', 'toddler'], minHours: 1 },
    qty: { expr: 'ceil(hours / 2) + 2', note: '{n}枚' },
  },
  {
    id: 'wipes',
    label: 'おしりふき',
    category: 'baby',
    scope: 'shared',
    when: { childBand: ['infant', 'toddler'] },
  },
  {
    id: 'milk-babyfood',
    label: 'ミルク / 離乳食',
    category: 'food',
    scope: 'per-child',
    when: { childBand: ['infant', 'toddler'] },
  },
  {
    id: 'baby-utensils',
    label: 'スプーン・エプロン',
    category: 'baby',
    scope: 'shared',
    when: { childBand: ['infant', 'toddler'] },
  },
  {
    id: 'burp-cloth',
    label: 'おくるみ',
    category: 'baby',
    scope: 'per-child',
    when: { childBand: ['infant'] },
  },

  // ---- 食事・飲み物（food）----
  {
    id: 'snack',
    label: 'おやつ・飲み物',
    category: 'food',
    scope: 'per-child',
    when: { childBand: ['preschool', 'school'] },
  },
  {
    id: 'water-bottle',
    label: '水筒',
    category: 'food',
    scope: 'per-adult',
    when: {},
  },

  // ---- 着替え・タオル（common）----
  {
    id: 'change-clothes',
    label: '着替え',
    category: 'common',
    scope: 'per-child',
    when: { childBand: ['infant', 'toddler', 'preschool'] },
    qty: { expr: 'max(1, floor(hours / 4))', note: '{n}セット' },
  },
  {
    id: 'towel',
    label: 'タオル',
    category: 'common',
    scope: 'per-child',
    when: { childBand: ['preschool', 'school'] },
  },

  // ---- モード別（mode）----
  {
    id: 'backpack',
    label: 'リュックサック（両手を空ける）',
    category: 'mode',
    scope: 'shared',
    when: { mode: ['solo-parent'] },
  },
  {
    id: 'baby-carrier',
    label: '抱っこ紐',
    category: 'mode',
    scope: 'shared',
    when: { mode: ['solo-parent'], childBand: ['infant', 'toddler'] },
  },

  // ---- 共通常備品（common）----
  {
    id: 'wet-tissues',
    label: 'ウェットティッシュ・ティッシュ',
    category: 'common',
    scope: 'shared',
    when: {},
  },
  {
    id: 'plastic-bags',
    label: 'ビニール袋（汚物・ゴミ用）',
    category: 'common',
    scope: 'shared',
    when: { childBand: ['infant', 'toddler'] },
  },
  {
    id: 'first-aid',
    label: '救急セット（絆創膏・常備薬）',
    category: 'common',
    scope: 'shared',
    when: {},
  },
  {
    id: 'power-bank',
    label: 'モバイルバッテリー',
    category: 'common',
    scope: 'shared',
    when: { minHours: 4 },
  },

  // ---- 行き先別（destination）----
  {
    id: 'insect-repellent',
    label: '虫よけ / 日焼け止め',
    category: 'destination',
    scope: 'shared',
    when: { destinations: ['park', 'seaside', 'outdoor'] },
  },
  {
    id: 'hat',
    label: '帽子',
    category: 'destination',
    scope: 'per-child',
    when: { destinations: ['park', 'seaside', 'outdoor', 'theme_park'] },
  },
  {
    id: 'leisure-sheet',
    label: 'レジャーシート',
    category: 'destination',
    scope: 'shared',
    when: { destinations: ['park', 'seaside', 'outdoor'] },
  },
  {
    id: 'swimwear',
    label: '水着・ラッシュガード',
    category: 'destination',
    scope: 'per-child',
    when: { destinations: ['seaside'] },
  },
  {
    id: 'extra-layer',
    label: '冷房対策の上着',
    category: 'destination',
    scope: 'shared',
    when: { destinations: ['indoor', 'theme_park'] },
  },
  {
    id: 'rain-gear',
    label: 'レインコート・折りたたみ傘',
    category: 'destination',
    scope: 'shared',
    when: { destinations: ['outdoor', 'theme_park'] },
  },

  // ---- 夜間 ----
  {
    id: 'night-light',
    label: 'ライト / 怖がり用アイテム',
    category: 'common',
    scope: 'shared',
    when: { flags: ['night'] },
  },
] as const;
