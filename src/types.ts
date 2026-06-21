// アプリ全体の型定義。すべてイミュータブル（readonly）。

export type MemberType = 'adult' | 'child';

/** 生年月日から導出される年齢バンド。 */
export type AgeBand = 'infant' | 'toddler' | 'preschool' | 'school';

/** 登録された同行者マスターデータ。 */
export interface Member {
  readonly id: string;
  readonly type: MemberType;
  readonly name: string;
  /** 子どもの場合の生年月日（ISO: YYYY-MM-DD）。 */
  readonly birthDate?: string;
  readonly usesStroller?: boolean;
  readonly usesDiapers?: boolean;
}

export type DestinationId = 'park' | 'theme_park' | 'indoor' | 'seaside' | 'outdoor';

export interface Destination {
  readonly id: DestinationId;
  readonly label: string;
  readonly icon: string;
}

/** 現地条件のトグルフラグ。 */
export type Flag = 'stroller' | 'car' | 'night';

/** 大人構成から導出される運用モード。 */
export type Mode = 'solo-parent' | 'multi-adult';

export type ItemCategory = 'baby' | 'food' | 'common' | 'destination' | 'mode';

export type ItemScope = 'per-child' | 'per-adult' | 'shared';

/** アイテム/動線メモの発火条件（すべて AND）。 */
export interface ItemWhen {
  /** 指定バンドの子どもが1人以上いるか。 */
  readonly childBand?: readonly AgeBand[];
  /** 選んだ行き先がいずれかに一致するか。 */
  readonly destinations?: readonly DestinationId[];
  /** 滞在時間の下限（時間）。 */
  readonly minHours?: number;
  /** 滞在時間の上限（時間）。 */
  readonly maxHours?: number;
  /** 導出されたモードがいずれかに一致するか。 */
  readonly mode?: readonly Mode[];
  /** 現地条件フラグがいずれか1つでも有効か。 */
  readonly flags?: readonly Flag[];
}

export interface ItemQty {
  /** 安全なサブセット式（数値・hours・四則・ceil/floor・カッコ）。 */
  readonly expr: string;
  /** "{n}" が計算結果に置換される注記。 */
  readonly note: string;
}

export interface ItemRule {
  readonly id: string;
  readonly label: string;
  readonly category: ItemCategory;
  readonly scope: ItemScope;
  readonly when: ItemWhen;
  readonly qty?: ItemQty;
}

export interface RouteNoteRule {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly when: ItemWhen;
}

/** 「持ち物を作る」画面でのユーザー選択。 */
export interface GenerationInput {
  readonly selectedMemberIds: readonly string[];
  readonly destination: DestinationId;
  readonly hours: number;
  readonly flags: readonly Flag[];
}

/** 評価時に導出される子どもプロファイル。 */
export interface ChildProfile {
  readonly member: Member;
  readonly ageMonths: number;
  readonly band: AgeBand;
}
