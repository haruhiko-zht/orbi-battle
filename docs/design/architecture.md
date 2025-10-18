# アーキテクチャ

orbi-battle はシミュレーションで確定した `BattleLog` を軸に、描画と UI を疎結合で連携させる構成です。

## レイヤー構造

- **Simulation** — `src/sim/`。純粋ロジックでバトルを固定ステップ計算し、ログと検証を担当。
- **Rendering** — `src/render/`。Phaser シーンが `BattleLog` を再生し、HUD とアニメーションを描画。
- **UI** — `src/ui/`。React デバッグパネルと `orbiBridge` が `window.$orbi` API を操作。
- **Config / Types** — `src/config/`, `src/types/`。プリセットと共有型で全レイヤーを統制。

## 主要モジュール

- `src/main.ts` — Phaser ゲームとデバッグパネルを初期化し、`window.$orbi` を公開。
- `BattleRuntimeController` — `BattleLog` を管理し再生・シーク・リセットの API をまとめる。
- `phaserScene.ts` / `battleLayers.ts` — HUD と射程表示を組み立て、Phaser 更新ループから描画する。
- `simulateBattle` / `BattleSim` — ログの生成・再生ヘルパー。決定論と `structuredClone` 配布を担保。
- `validation.ts` — `BattleConfig` の事前検証。未知の `aiType` や異常値を遮断。

## データフロー

### 起動

1. `main.ts` が `new Phaser.Game()` と `createDebugPanel()` を生成。
2. `BattleRuntimeController` がプリセットを検証し `simulateBattle()` で `BattleLog` を生成。
3. `window.$orbi` に再生 API を束ね、UI・コンソールから共通操作できるようにする。

### 再生ループ

1. `requestAnimationFrame` → `BattleScene.update(delta)`。
2. `BattleRuntimeController.update()` が再生速度・スキップロジックを処理。
3. 現在の `BattleState` を取得し、Scene が各レイヤーへ反映。

### リセット / 設定変更

1. `debugPanel` または API から `window.$orbi.reset(config)` を呼び出す。
2. 構成を `validateConfig` で検証後、`simulateBattle` が新しいログを生成。
3. `BattleScene` が初期フレームを描画し、再生状態をリセット。

## `window.$orbi` API

`src/types/global.d.ts` で型付けされ、開発者コンソールと UI から利用できます。

- `reset(config)` — 検証後にバトルを再計算。
- `play()` / `pause()` / `stepFrame()` / `seekFrame(index)` — 再生制御。
- `setPlaybackRate(rate)` — 速度変更。
- `getPlaybackInfo()` — 現在フレーム・総フレーム・再生状態を取得。
- `getLog()` — `BattleLog` を取得（読み取りのみ想定）。
- `game` — `Phaser.Game` インスタンス。描画調査用。

## 設計原則

- **決定論の維持** — `Mulberry32` RNG と完全なログ保存で同一入力から同一結果を保証。
- **責務分離** — Simulation は Phaser を知らず、Rendering はログの読み取りに専念。
- **型安全** — 公開 API は TypeScript 型を通り、`window.$orbi` もグローバル型で保証。
- **開発効率** — 再現性の高いログと Vitest によりリグレッションを高速確認。

## 拡張ポイント

- **AI 拡張** — `EngineOptions.createFighterSystems` を差し替えて職業・装備ごとの挙動を追加。
- **イベントフック** — `BattleRuntimeController` にヒット／死亡イベントを通知して演出を拡張。
- **パフォーマンス** — フレーム間引き、差分ログ、Web Worker 化などを検討中。
