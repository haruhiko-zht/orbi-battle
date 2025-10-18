# orbi-battle

Phaser + TypeScript 製の円形アリーナ向け決定論的オートバトルシミュレーター。バトルは事前に全フレーム計算し、結果をログとして再生・検証できます。

## 特徴

- **全フレーム事前シミュレーション**: `simulateBattle` が固定ステップでログを生成し、巻き戻し・高速再生が即座に可能。
- **決定論の担保**: `seed` と構成が同じなら常に同じ `BattleLog` を出力。Vitest で差分検証しやすい設計です。
- **3 レイヤー分離**: Simulation / Rendering / UI を疎結合化し、Node.js 上でシミュレーションだけを実行できます。
- **デバッグ支援**: React 製パネルと `window.$orbi` API からリセット・シーク・再生速度変更を即時操作。
- **AI 拡張性**: `src/sim/ai` に戦略とレジストリを集約し、プリセットで挙動比較が容易です。

## セットアップ

```bash
npm install
npm run dev
```

1. 上記コマンド後に `http://localhost:5173` を開くと 1v1 プリセットが再生されます。
2. 右側のデバッグパネルでパラメータを調整し `Restart` を押すと即時再シミュレートされます。
3. ブラウザコンソールから `window.$orbi` を呼び出すとログ取得やフレーム操作が可能です。

## 主要ディレクトリ

- `src/sim/` — バトルエンジン・AI・ログ生成・入力検証。
- `src/render/` — Phaser シーンと再生制御、HUD や射程表示の描画。
- `src/ui/` — デバッグパネルと `window.$orbi` ブリッジ。
- `src/config/defaults.ts` — 1v1 / 3v3 / AI デモ / Mixed などのプリセット。
- `src/types/` — 共有型定義と `global.d.ts` によるグローバル API 型付け。

## 実装ハイライト

- `BattleRuntimeController` が `BattleLog` を Phaser シーンへストリーミングし、再生速度やシークを集中管理。
- `createDefaultFighterSystems()` を基にシミュレーションシステムを構築。`EngineOptions.createFighterSystems` から挙動を差し替えられます。
- `Mulberry32` RNG と `structuredClone` 配布でログの再現性と副作用の無さを保証します。

## ドキュメント

- [docs/README.md](./docs/README.md) — 目的別ナビゲーション。
- 設計ガイド: [`docs/design/architecture.md`](./docs/design/architecture.md) / [`simulation.md`](./docs/design/simulation.md) / [`rendering.md`](./docs/design/rendering.md) / [`parameters.md`](./docs/design/parameters.md)
- 開発ガイド: [`docs/dev/setup.md`](./docs/dev/setup.md) / [`testing.md`](./docs/dev/testing.md) / [`ai-system.md`](./docs/dev/ai-system.md) / [`roadmap.md`](./docs/dev/roadmap.md)
- 更新履歴: [`docs/changelog.md`](./docs/changelog.md)

## よく使う npm スクリプト

- `npm run dev` — Vite 開発サーバー。
- `npm run build` — 型チェック付き本番ビルド（出力 `dist/`）。
- `npm run preview` — 本番ビルドのローカル確認。
- `npm run test` — Vitest（happy-dom）。
- `npm run test:ui` — Vitest UI。
- `npm run test:coverage` — HTML / lcov カバレッジ生成。
