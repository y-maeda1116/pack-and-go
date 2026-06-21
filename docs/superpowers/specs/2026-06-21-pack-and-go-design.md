# パックアンドゴー（Pack and Go）— 設計仕様書

- 作成日: 2026-06-21
- ステータス: 承認済み（実装へ移行）
- ホスティング: GitHub Pages（完全無料・静的サイト）

## 1. 目的

同行する人数・子どもの年齢・行き先・滞在時間に応じて、**最適化された持ち物リスト**と**現地の動線注意点**を動的に生成する、スマートフォン向けWebアプリ。サーバーコストゼロで GitHub Pages 上で運用する。

## 2. 機能要件

### 2.1 メンバープロファイル管理
- 同行者（大人・子ども）をマスターデータとして登録。
- 子どもは生年月日のみ入力し、現在の年齢（歳・月齢）と**年齢バンド**を自動計算。
- アプリを開くたびに年齢・バンドを再計算し、持ち物ロジックが自動切替する。

### 2.2 動的な持ち物リスト生成
- 「行く人（複数選択可）」「行き先」「滞在時間」「現地条件」を選択。
- 条件の掛け合わせで最適化されたチェックリストを生成。
- **大人1人＋子ども複数** → `solo-parent`（ワンオペ）モード：両手が空くリュック必須等を提示。
- **大人2人以上** → `multi-adult` モード：荷物分担案を提示。

### 2.3 動線・スポットメモ
- 「ベビーカー利用あり」等の条件に応じ、現地の注意点（エレベーター優先ルート・多目的トイレ位置など）を画面上部にピン留め表示。

## 3. 年齢バンド定義

| バンド ID    | 月齢        | 日本語表示 | 連動する持ち物の傾向            |
|--------------|-------------|------------|-------------------------------|
| `infant`     | 0〜11ヶ月   | 乳児       | オムツ・ミルク・おくるみ        |
| `toddler`    | 12〜35ヶ月  | 幼児       | オムツ・離乳食・着替え          |
| `preschool`  | 36〜71ヶ月  | 幼児       | おやつ・着替え・タオル          |
| `school`     | 72ヶ月以上  | 学童       | 水筒・着替え                    |

計算式: `months = (today.year - birth.year) * 12 + (today.month - birth.month)`、`today.day < birth.day` なら -1（0未満は0にクランプ）。

## 4. データ構造（JSON）

### 4.1 メンバー（ユーザー入力・localStorage 保存）
```jsonc
{
  "members": [
    { "id": "a1", "type": "adult", "name": "パパ" },
    {
      "id": "c1", "type": "child", "name": "はるく",
      "birthDate": "2024-02-15",
      "usesStroller": true, "usesDiapers": true
    }
  ]
}
```

### 4.2 アイテムルール（アプリ同梱の固定データ）
各アイテムは `when`（発火条件・AND）を持つ。評価は純関数。
```jsonc
{
  "id": "diapers",
  "label": "オムツ",
  "category": "baby",
  "scope": "per-child",
  "when": { "childBand": ["infant","toddler"], "minHours": 1 },
  "qty": { "expr": "ceil(hours / 2) + 2", "note": "{n}枚" }
}
```

`when` の条件キー（すべて AND）:
| キー | 意味 |
|------|------|
| `childBand` | 指定バンドの子どもが1人以上いる |
| `destinations` | 選んだ行き先がいずれかに一致 |
| `minHours` / `maxHours` | 滞在時間の下限/上限（時間） |
| `mode` | `solo-parent` / `multi-adult` |
| `flags` | `stroller` `car` `night` などの現地条件 |

`scope`: `per-child`（子ども各々）/ `per-adult`（大人各々）/ `shared`（家族で1）。

`qty.expr`: 安全なサブセット式（数値・`hours`・`+ - * / ()`・`ceil` `floor` のみ）。`eval` / `Function` は使わず、自前のトークナイザで評価する。`note` の `{n}` は計算結果に置換。

### 4.3 動線メモ（ピン留めルール）
```jsonc
{
  "id": "elevator-route",
  "label": "エレベーター優先ルートを確認",
  "icon": "🛗",
  "when": { "flags": ["stroller"] }
}
```

### 4.4 行き先マスター
`park` / `theme_park` / `indoor` / `seaside` / `outdoor`（label + icon）。

## 5. 評価フロー（純関数）

```
選択入力 → context {
  selectedMembers, children[], adults[],
  bandsPresent:Set, destination, hours,
  mode, flags:Set, strollerInUse
} → generateItems(rules, ctx)  → アイテム[]
  → generateRouteNotes(notes, ctx) → ピン留め[]
  → baggageSharingPlan(ctx) → 分担案|null
```

- `mode` 判定: 大人1+子ども1以上 → `solo-parent`、大人2以上 → `multi-adult`、それ以外 null。
- 全体を純関数化し、Vitest で単体テストする。

## 6. 画面構成（スマホ縦・SPA・3画面＋ボトムタブ）

1. **メンバー管理**: 登録一覧＋追加/編集モーダル。子どもは自動で年齢・バンド・「〇〇モード」表示。
2. **持ち物を作る**: 行く人複数選択／行き先／滞在時間スライダー／現地条件フラグ → 生成ボタン。
3. **結果表示**: 上部に動線メモ（ピン留め）→ モード案（ワンオペ／分担）→ カテゴリ・対象者別チェックリスト。チェック状態は localStorage に永続化。

## 7. 技術スタック

| レイヤ | 選択 | 理由 |
|--------|------|------|
| 言語 | TypeScript | 型安全・イミュータブル（coding-style 準拠） |
| ビルド | Vite | 静的 `dist/` を生成 → GitHub Pages 配置 |
| スタイル | Tailwind CSS v4（`@tailwindcss/vite`） | 設定ファイル不要・スマホ最適化を高速に |
| 状態 | localStorage | サーバ不要・バックエンドゼロコスト |
| テスト | Vitest | 年齢計算・ルール評価の純関数テスト |

Vite の `base` は `'./'`（相対パス）とし、ユーザー/リポジトリ Pages のどちらでも動くようにする。

## 8. エラー処理・入力バリデーション
- 生年月日: 未来日不可・必須（子ども）。誤入力は保存時にバリデーション。
- localStorage 読込失敗: 空状態へ安全にフォールバック。
- qty 式パース失敗: 式を無視し `note` の `{n}` 無しで表示。

## 9. ファイル構成（小ファイル主義）
```
src/
  types.ts
  data/destinations.ts
  data/itemRules.ts
  data/routeNotes.ts
  logic/age.ts
  logic/expr.ts
  logic/mode.ts
  logic/evaluate.ts
  logic/plan.ts          # 分担案
  state/storage.ts
  state/store.ts
  ui/app.ts              # ルータ/タブ
  ui/membersScreen.ts
  ui/generateScreen.ts
  ui/resultScreen.ts
  ui/components.ts
  index.css
  main.ts
test/
  age.test.ts
  expr.test.ts
  evaluate.test.ts
```

## 10. デプロイ
- `.github/workflows/deploy.yml`: `main` への push で Vite ビルド → `actions/deploy-pages` で Pages 配置。
- README.md にリポジトリ設定（Pages Source = GitHub Actions）手順を記載。

## 11. スコープ外（YAGNI）
- 天気/季連動・複数端末同期・アカウント機能・PWAインストール・i18n は v1 では扱わない。
