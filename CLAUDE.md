# CLAUDE.md

このドキュメントは Claude Code（claude.ai/code）で作業する開発者向けのクイックガイドです。目的・レイヤー分割・テスト方針を把握した上でタスクに取り組んでください。（最終更新: 2025-10-18）

## プロジェクト概要

- **orbi-battle** は決定論的バトルシミュレーターです。`simulateBattle` が全フレームを事前計算し、Phaser で再生します。
- クライアントは React 製デバッグパネルと `window.$orbi` API を持ち、構成変更やシークを即時操作可能です。
- 詳細設計やポリシーは `docs/` と `AGENTS.md` を参照してください。

## セットアップ / 基本コマンド

```bash
npm install
npm run dev          # http://localhost:5173/
npm run test         # Vitest (happy-dom)
npm run build        # 型チェック付き本番ビルド
npm run preview      # build 済み成果物を配信
npm run test:coverage# V8 カバレッジ
npm run format       # Prettier
```

個別テストは `npx vitest run path/to/test.ts`、ウォッチは `npx vitest --watch` を利用します。

## レイヤー概観

- **Simulation (`src/sim/`)** — Node.js 互換の純粋ロジック。`simulateBattle` / `BattleSim` / `validation.ts` / `rng.ts` を中心に構成。
- **Rendering (`src/render/`)** — `BattleRuntimeController` と `phaserScene.ts` が `BattleLog` を再生し、HUD／射程表示を描画。
- **UI (`src/ui/`)** — `debugPanel.tsx` と `api/orbiBridge.ts` が `window.$orbi` を介して操作。
- **Config & Types** — `src/config/defaults.ts`（1v1, 3v3, 戦術デモ, Mixed）と `src/types/`（`global.d.ts`, `playback.ts`）。

## 実行フロー

1. `src/main.ts` が Phaser とデバッグパネルを初期化し、`window.$orbi` を公開。
2. `window.$orbi.reset(config)` → `validateConfig` → `simulateBattle` が新規 `BattleLog` を生成。
3. `BattleRuntimeController` がログと再生状態を管理し、`BattleScene`（`phaserScene.ts`）へフレームを供給。
4. UI は `orbiBridge` を通じて `getPlaybackInfo()` をポーリングし、コンポーネントを同期。

## 主要モジュールの着目点

- `src/sim/engine.ts` — フレーム更新。移動・攻撃・クールダウン・勝敗判定を制御。
- `src/sim/tactics/` — `TACTIC_DEFINITIONS` と `TACTIC_OPTIONS` を管理し、`nearest`/`aggressive`/`defensive` 戦略を実装。
- `src/sim/systems/` — 位置計算や攻撃解決を分離したシステム群。
- `src/sim/log.ts` — `cloneConfig` など決定論維持のユーティリティ。
- `src/render/battleRuntimeController.ts` — 再生速度・シーク・終了判定を統括。
- `src/render/battleLayers.ts` — Arena / Fighter / HP HUD レイヤー組み立て。
- `src/render/playbackController.ts` — フレームスキップ制御で描画追従を保証。
- `src/ui/api/orbiBridge.ts` — `window.$orbi` と React の橋渡し。

## 品質とテスト方針

- シミュレーション層へ変更を加えたら必ず `npm run test`。決定論に影響する場合はログ差分テストを更新。
- 描画改修は限定的なユニットテストに加え、`npm run preview` でビジュアル確認。必要ならキャプチャを PR に添付。
- UI は hooks 単位でテストし、`happy-dom` 環境で DOM 操作を検証。過度なスナップショットは避け、明示的アサーションを使用。
- `npm run format` を習慣化し、TypeScript strict モード下で `any` を極力排除。

## 拡張ヒント

- **戦術追加**: `TACTIC_DEFINITIONS` → `tacticFactories` → プリセット / UI の順に更新し、`__tests__/tactics.test.ts` で決定論を検証。
- **ビジュアル演出**: `battleLayers.ts` を拡張し、シミュレーション層の出力のみを利用してエフェクトを追加。
- **設定追加**: `defaults.ts`・`validation.ts`・`debugPanel.tsx`・`global.d.ts` を同時に更新して一貫性を保つ。
- **システム拡張**: `EngineOptions.createFighterSystems` をカスタム実装に差し替え、`FighterParams` / `FighterState` へ属性を追加。

## 守るべき制約

- バトルは 2 チーム固定（`teams[0]`=味方, `teams[1]`=敵）。多人数戦の一般化は不要。
- 決定論を最優先: `Math.random()` や `Date.now()` は使用禁止。`src/sim/rng.ts` の `Mulberry32` を利用。
- シミュレーション層で Phaser/DOM/API 依存を導入しない。Node.js からも動作可能な構成を維持。
- `window.$orbi` 以外のグローバル公開は禁止。追加 API は `global.d.ts` とドキュメントを同時更新。
- コメント・ドキュメントは日本語を基調とし、必要に応じて英語原語を併記して意図を明確にする。

以上を踏まえ、変更内容に合わせてドキュメントとテストを必ず更新してください。
