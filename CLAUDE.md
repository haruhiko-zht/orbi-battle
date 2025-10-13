# CLAUDE.md

このドキュメントは Claude Code（claude.ai/code）向けの開発ガイドです。リポジトリの目的、レイヤー分割、テスト方針を把握した上で作業してください。

## プロジェクト概要

- **orbi-battle** は 2D 円形アリーナのオートバトルを、決定的シミュレーション（pre-simulation）→リプレイ描画の 2 段構成で実現します。
- クライアント側は Phaser による描画と React 製デバッグ UI を持ち、`window.$orbi` 経由でバトルを再生成できます。
- 設計ノートや仕様は `docs/`、追加ガイダンスは `AGENTS.md` を参照してください。

## セットアップとコマンド

```bash
npm install          # 依存関係の導入
npm run dev          # Vite 開発サーバー (http://localhost:5173/)
npm run build        # 本番ビルド (出力: dist/)
npm run preview      # 本番ビルドのローカル確認
npm run test         # Vitest (happy-dom)
npm run test:ui      # Vitest UI
npm run test:coverage# V8 カバレッジレポート
npm run format       # Prettier 整形
npm run format:check # 整形差分の検出
```

- 特定テストのみ実行したい場合は `npx vitest path/to/file.test.ts` または `npx vitest --watch` を用います。

## アーキテクチャの全体像

```
┌────────────────────────────────────────────────┐
│  UI Layer (src/ui/)                            │ ← React デバッグパネル / window.$orbi API
├────────────────────────────────────────────────┤
│  Rendering Layer (src/render/)                 │ ← Phaser シーン、レイヤー構築、再生制御
├────────────────────────────────────────────────┤
│  Simulation Layer (src/sim/)                   │ ← 決定的バトルエンジン、本体ロジック
├────────────────────────────────────────────────┤
│  Shared Config & Types (src/config/, src/types/)│ ← プリセット、型定義、再生情報
└────────────────────────────────────────────────┘
```

- シミュレーション層は Node.js 互換を維持し、DOM/Phaser/API への依存を禁止します。
- UI/レンダリング層は `window.$orbi` ブリッジを通じて設定やリプレイ制御を行います。

## 実行フロー

1. `src/main.ts` が Phaser ゲームとデバッグパネルを初期化し、`window.$orbi.reset` を公開。
2. `window.$orbi.reset(config)` が呼ばれると、`simulateBattle(config)`（`src/sim/battle.ts`）が全フレームを計算し `BattleLog` を返却。
3. `BattleSim`（`src/sim/battle.ts`）が固定タイムステップでログを再生し、`PlaybackInfo` を `src/types/playback.ts` で共有。
4. `src/render/phaserScene.ts` と関連コントローラが `BattleSim` から現在フレームを取得して描画。
5. `src/ui/debugPanel.tsx` が `orbiBridge` 経由でリプレイ状態をポーリングし、UI を同期。

## 主要モジュール

- `src/sim/engine.ts`: フレーム更新の中心。移動、攻撃、クールダウン、勝敗判定を管理。
- `src/sim/ai/`: `AI_OPTIONS` や AI 戦略（`aggressive`, `defensive`, `nearest` など）を定義。
- `src/sim/systems/`: 位置計算・衝突・攻撃解決などのドメイン別サブルーチン。
- `src/sim/placement/`: 円形アリーナ内での初期配置。
- `src/sim/log.ts`: `cloneConfig`, `cloneState` など決定性を維持するユーティリティ。
- `src/render/battleRuntimeController.ts`: `BattleSim` の再生速度・一時停止・シークを管理。
- `src/render/battleLayers.ts`: Phaser 用の描画レイヤー生成。
- `src/render/playbackController.ts`: フレーム単位の進行と UI 連携。
- `src/ui/api/orbiBridge.ts`: `window.$orbi` と React UI の間の状態同期。
- `src/config/defaults.ts`: デフォルトプリセット (`defaults`, `defaults3v3`, `aiDemoConfig`, `mixedAI3v3` など)。
- `src/types/playback.ts`: 再生状態 (`PlaybackInfo`) の共有型。

## テストと品質指針

- シミュレーション層の変更時は `npm run test` を必須実行。RNG/物理計算の差分が疑われる場合は `npm run test:coverage` で範囲を確認し、必要に応じて新規テストを追加します。
- 描画層は Phaser 依存のため単体テストは限定的です。ビジュアルの変更を行った場合は `npm run preview` でキャプチャを取り、PR に添付してください。
- `src/ui` の React コンポーネントはフック単位で切り出し、入力（props）と副作用をテストしやすく保ちます。`__tests__` ディレクトリを使用し、`happy-dom` 環境向けのテストで DOM 操作を検証します。
- Prettier (`npm run format`) と TypeScript strict モードを前提としており、`any` の使用は避けます。

## 拡張時のヒント

- **AI 追加**: `src/sim/ai/types.ts` に列挙を追加し、`src/sim/ai/index.ts` のエクスポートと `AI_OPTIONS` を更新。テストで決定性を確認。
- **ビジュアル演出**: `src/render/battleLayers.ts` を拡張し、シミュレーション層には影響させない。`BattleSim` から取得できる情報のみを利用します。
- **サーバー連携**: Node.js から `simulateBattle()` を呼び出し、生成した `BattleLog` をクライアントに渡せば同じ演算を再生可能です。`seed` と `BattleConfig` を一致させることで検証が行えます。
- **設定追加**: `src/config/defaults.ts` とバリデーション (`src/sim/validation.ts`) を更新し、UI 側のフォーム（`debugPanel.tsx`）に対応する入力を追加してください。
- **システム拡張**: `EngineOptions.createFighterSystems` から `createDefaultFighterSystems()` を拡張したパイプラインを注入すると、職業・装備システムなどファイターごとの挙動差分を安全に実装できます。`FighterSystemContext.self.params` に追加フィールドを持たせて処理を分岐させてください。

## 守るべき制約

- チーム構成は 2 チーム固定（味方 / 敵）が仕様です。多人数戦の一般化は不要で、`resolveBattleTeams()` などもこの前提で最適化されています。
- 決定性を最優先: `Math.random()` や `Date.now()` などの非決定的 API はシミュレーション層で使用禁止。`src/sim/rng.ts` の擬似乱数を利用します。
- 型安全の維持: `src/types` に共通型を定義し、`declare global`（`global.d.ts`）で `window.$orbi` を宣言済み。追加のグローバルは避ける。
- パフォーマンス: シミュレーションは 60Hz (`tickRate`) 固定タイムステップ。ループ内の割り当てを最小化し、必要なら `systems/` に処理を分割します。
- ドキュメント・コメントは日本語を基調にしつつ、必要時に英語原語を併記して意図を明確にしてください。

以上を踏まえ、変更内容に応じたテスト・ドキュメント更新を忘れずに行ってください。
