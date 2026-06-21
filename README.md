# 🎒 パックアンドゴー（Pack and Go）

同行する人数・子どもの年齢・行き先・滞在時間に合わせて、**最適化された持ち物リスト**と**現地の動線注意点**を動的に生成するスマートフォン向け Web アプリです。

- サーバーコスト **ゼロ**（完全静的サイト・localStorage で永続化）
- **GitHub Pages** で無料ホスティング
- フロントエンド完結（Vite + TypeScript + Tailwind CSS v4）

## ✨ 主な機能

1. **メンバープロファイル管理**
   - 大人・子どもをマスター登録。子どもは生年月日だけ入力し、**年齢（歳・月齢）と年齢バンドを自動計算**。
   - アプリを開くたびに年齢を再計算し、持ち物ロジックが自動切替（乳児→オムツ・ミルク、幼児→おやつ・着替え…）。
2. **動的な持ち物リスト生成**
   - 「行く人（複数選択可）」「行き先」「滞在時間」「現地条件」を選んで生成。
   - **大人1名＋子ども** → ワンオペモード（両手が空くリュック必須・抱っこ紐を提示）。
   - **大人2名以上** → 荷物分担案（メインバッグ／サブバッグに振り分け）。
3. **動線・スポットメモ**
   - ベビーカー利用・乳幼児同伴などの条件で、エレベーター優先ルート・多目的トイレ位置などを画面上部に**ピン留め表示**。

## 🧱 技術スタック

| レイヤ | 技术 | 役割 |
| --- | --- | --- |
| 言語 | TypeScript | 型安全・イミュータブルな設計 |
| ビルド | Vite | 静的 `dist/` を生成 |
| スタイル | Tailwind CSS v4（`@tailwindcss/vite`） | 設定ファイル不要のスマホ最適化 |
| 状態保持 | localStorage | サーバ不要のデータ永続化 |
| テスト | Vitest | 年齢計算・ルール評価の単体テスト |

## 🚀 セットアップ（ローカル開発）

前提: Node.js 20 以上・npm

```bash
npm install      # 依存関係の導入
npm run dev      # 開発サーバ（http://localhost:5173）
npm test         # 単体テスト
npm run typecheck # 型チェック
npm run build    # 本番ビルド → dist/
npm run preview  # ビルド成果物の確認（http://localhost:4173）
```

## 🌐 GitHub Pages へのデプロイ

リポジトリの `main` ブランチに push すると、[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) が **typecheck → test → build → デプロイ** を自動実行します。

### 初回設定手順

1. **GitHub にリポジトリを作成**し、このプロジェクトを push します。
   ```bash
   git add .
   git commit -m "feat: パックアンドゴー初版"
   git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```
2. ブラウザでリポジトリを開き **Settings → Pages** を開きます。
3. **Build and deployment** の **Source** を **GitHub Actions** に変更します。
   - （「Deploy from a branch」ではありません。「GitHub Actions」を選んでください）
4. `main` に push された時点でワークフローが実行され、完了後に Pages URL が発行されます。
   - URL は `https://<ユーザー名>.github.io/<リポジトリ名>/` になります。
   - リポジトリ名が `<ユーザー名>.github.io` の場合は `https://<ユーザー名>.github.io/` になります。

> **ベースパスについて**: `vite.config.ts` の `base: './'`（相対パス）により、ユーザー Pages とリポジトリ Pages のどちらでも追加設定なしで動作します。

### デプロイの再実行

Actions タブから `Deploy to GitHub Pages` ワークフローを `workflow_dispatch` で手動実行できます。

## 📁 プロジェクト構成

```
src/
  types.ts                  # 型定義（すべて readonly）
  data/
    destinations.ts         # 行き先マスター
    itemRules.ts            # 持ち物ルールマスター（★ここを編集で持ち物を拡張）
    routeNotes.ts           # 動線メモルールマスター
  logic/
    age.ts                  # 生年月日→月齢・年齢バンド（純関数）
    expr.ts                 # qty.expr の安全な数式評価器（eval 不使用）
    mode.ts                 # ワンオペ/分担モード判定
    evaluate.ts             # ルール評価エンジン（純関数・中核）
    plan.ts                 # 荷物分担案の生成
  state/
    storage.ts              # localStorage 読み書き（例外安全）
    store.ts                # アプリ状態・アクション（イミュータブル）
  ui/
    app.ts                  # ルータ・ヘッダ・ボトムタブ
    membersScreen.ts        # 画面1: メンバー管理
    generateScreen.ts       # 画面2: 持ち物を作る
    resultScreen.ts         # 画面3: 結果表示（ピン留め＋モード＋リスト）
    components.ts           # DOM 構築ヘルパ（innerHTML 不使用・XSS 安全）
test/
  age.test.ts, expr.test.ts, evaluate.test.ts
```

## 🧩 持ち物ロジックの拡張方法

**コードを変更せず、データ JSON（`src/data/*.ts`）を編集するだけで持ち物を追加・調整できます。**

### アイテムを追加する（`src/data/itemRules.ts`）

```ts
{
  id: 'ticket',
  label: 'チケット / モバイルパス',
  category: 'destination',
  scope: 'shared',
  when: { destinations: ['theme_park'] },
}
```

`when` に指定できる条件（すべて AND）:

| キー | 意味 |
| --- | --- |
| `childBand` | 指定バンド（`infant`/`toddler`/`preschool`/`school`）の子どもが1人以上いる |
| `destinations` | 選んだ行き先がいずれかに一致 |
| `minHours` / `maxHours` | 滞在時間の下限/上限（時間） |
| `mode` | `solo-parent`（大人1+子ども）/ `multi-adult`（大人2+） |
| `flags` | `stroller` / `car` / `night` のいずれかが有効 |

`scope`: `shared`（家族で1）/ `per-child`（子ども各々）/ `per-adult`（大人各々）

`qty`（個数の自動計算）は安全なサブセット式を使います:

```ts
qty: { expr: 'ceil(hours / 2) + 2', note: '{n}枚' }  // {n} に計算結果が入る
```

> `expr` で使える要素: 数値、`hours`、`+ - * /`、`()`、`ceil` / `floor`。`eval` や `Function` は使わず自前のパーサで評価します（安全）。

### 動線メモを追加する（`src/data/routeNotes.ts`）

```ts
{ id: 'parking', label: '駐車場・降車スペースを確認', icon: '🅿️', when: { flags: ['car'] } }
```

### 行き先を追加する（`src/data/destinations.ts`）

`id` / `label` / `icon` を追加し、必要に応じて `itemRules.ts` の `when.destinations` で参照します。

## 🧪 品質管理

- `npm run build` が `tsc --noEmit`（厳密な型チェック）＋ `vite build` を実行します。
- GitHub Actions のデプロイ前に `typecheck` と `test` が必ず走り、失敗すればデプロイされません。
- UI は `innerHTML` を使わず DOM API で構築し、XSS を構造的に防止しています。

## 📝 設計の詳しくは

`docs/superpowers/specs/2026-06-21-pack-and-go-design.md` に設計仕様書があります。
