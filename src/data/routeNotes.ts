import type { RouteNoteRule } from '../types';

/**
 * 動線メモ（画面上部にピン留め）ルールマスター。
 * 条件を満たすものだけが表示される。
 */
export const ROUTE_NOTE_RULES: readonly RouteNoteRule[] = [
  {
    id: 'elevator-route',
    label: 'エレベーター優先ルートを事前確認',
    icon: '🛗',
    when: { flags: ['stroller'] },
  },
  {
    id: 'multipurpose-toilet',
    label: '多目的トイレ・授乳室の位置をチェック',
    icon: '🚻',
    when: { childBand: ['infant', 'toddler'] },
  },
  {
    id: 'rest-spots',
    label: '休憩スペース・日よけを確認',
    icon: '🫖',
    when: {
      childBand: ['infant', 'toddler', 'preschool'],
      destinations: ['theme_park', 'outdoor', 'seaside'],
    },
  },
  {
    id: 'stroller-parking',
    label: 'ベビーカー預かり・通路の広さを確認',
    icon: '🅿️',
    when: { flags: ['stroller'], destinations: ['indoor', 'theme_park'] },
  },
  {
    id: 'night-safety',
    label: '帰路の照明・足元に注意',
    icon: '🌙',
    when: { flags: ['night'] },
  },
] as const;
