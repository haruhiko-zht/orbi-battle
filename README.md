# orbi-battle

Phaser + TypeScript 製の決定論的オートバトルシミュレーター。アリーナの戦闘を事前に計算し、デバッグやリプレイ検証を高速に行えます。

## クイックスタート

1. `npm install`
2. `npm run dev`
3. ブラウザで `http://localhost:5173`

## 主な特徴

- **事前シミュレーション方式**でバトルを全フレーム算出。ログを保存して巻き戻し・高速再生が自在。
- **決定論的エンジン**が seed と設定に対して常に同一結果を保証。Vitest によるリグレッション検証が容易。
- **レイヤー分離**（Simulation / Rendering / UI）によりロジックと描画を疎結合化。Node.js 上でシミュレーションのみ実行可能。
- **デバッグパネル + `window.$orbi` API**（型定義済み）からリセットやシーク、再生速度変更をリアルタイム操作。
- **AI 拡張ポイント**を `src/sim/ai` に集約し、パラメータと行動戦略をプリセットで試験できる。

## レイヤースタック

- `src/sim/`: バトルエンジン、AI、ログ、入力検証（`validation.ts`）。
- `src/render/`: Phaser シーンと再生制御。攻撃射程サークルや HP レイアウトを描画。
- `src/ui/`: React 製デバッグパネルと `window.$orbi` ブリッジ。
- `src/config/defaults.ts`: 1v1 / 3v3 / AI デモなどのプリセット。
- `src/types/`: グローバル型（`window.$orbi`）や再生情報の定義。

## ドキュメント

- [docs/README.md](./docs/README.md) — ドキュメントの入り口と目的別ナビゲーション
- 設計: [`docs/design/architecture.md`](./docs/design/architecture.md), [`simulation.md`](./docs/design/simulation.md), [`rendering.md`](./docs/design/rendering.md), [`parameters.md`](./docs/design/parameters.md)
- 開発: [`docs/dev/setup.md`](./docs/dev/setup.md), [`testing.md`](./docs/dev/testing.md), [`ai-system.md`](./docs/dev/ai-system.md), [`roadmap.md`](./docs/dev/roadmap.md)
- 履歴: [`docs/changelog.md`](./docs/changelog.md)

## 開発コマンド

- `npm run dev` — Vite ホットリロード開発サーバー
- `npm run build` — 本番ビルド（TypeScript 型チェック付き）
- `npm run preview` — `dist/` ビルドのローカル確認
- `npm run test` — Vitest（happy-dom ランタイム）
- `npm run test:ui` — Vitest UI
- `npm run test:coverage` — HTML / lcov カバレッジ出力
