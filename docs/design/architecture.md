# アーキテクチャ

orbi-battle はシミュレーション・描画・UI を分離し、決定論的なバトルログを中心にやり取りする構成です。

## レイヤー構造

```
┌─────────────────────────────────────┐
│             UI Layer                │ React + DOM（デバッグパネル）
├─────────────────────────────────────┤
│          Rendering Layer            │ Phaser（ログ再生専任）
├─────────────────────────────────────┤
│         Simulation Layer            │ 純粋ロジック（Node でも実行可）
├─────────────────────────────────────┤
│        Config / Shared Types        │ プリセット・型定義・検証
└─────────────────────────────────────┘
```

## 主要モジュール

- `src/main.ts` — Phaser とデバッグパネルの起動。`window.$orbi` を公開。
- `src/sim/` — バトルエンジン、AI、ログ、`validation.ts` による入力検証。
- `src/render/` — `BattleRuntimeController` がログを再生し、`phaserScene.ts` で描画。攻撃射程サークルや HP レイアウトを担当。
- `src/ui/` — React 製 `debugPanel.tsx` と `api/orbiBridge.ts`。`window.$orbi` を安全に呼び出す。
- `src/config/defaults.ts` — 1v1 / 3v3 / AI デモ / 混合 AI のプリセット。
- `src/types/global.d.ts` — `window.$orbi` の型定義を提供し、グローバル API を型安全に扱える。

## データフロー

### 起動

```
main.ts
  ├─→ new Phaser.Game()
  │    └─→ BattleScene.create()
  │         └─→ new BattleRuntimeController(defaults)
  │              └─→ BattleSim.precompute()
  │                   └─→ simulateBattle(defaults)
  └─→ createDebugPanel(defaults)
       └─→ window.$orbi を公開
```

### 毎フレーム更新

```
Phaser requestAnimationFrame
  └─→ BattleScene.update(delta)
       └─→ BattleRuntimeController.update(delta)
            └─→ PlaybackController.step()
                 └─→ BattleSim.getCurrentState()
                      └─→ BattleScene.renderState()
```

### リセット・設定変更

```
debugPanel ⇒ window.$orbi.reset(newConfig)
  └─→ BattleRuntimeController.reset(newConfig)
       └─→ validateConfig(newConfig)
       └─→ simulateBattle(newConfig)
       └─→ BattleScene.renderState(firstFrame)
```

## `window.$orbi` API

`src/types/global.d.ts` で型付けされたグローバル。デバッグパネルと開発者コンソールから利用します。

- `reset(config)` — 設定を検証したうえでバトルを再計算。
- `play() / pause()` — ログの再生制御。
- `stepFrame()` — 単一フレーム進行。
- `seekFrame(index)` — 任意フレームへシーク。
- `setPlaybackRate(rate)` — 再生速度変更。
- `getPlaybackInfo()` — 経過フレーム数や再生状態を取得。
- `getLog()` — 事前計算済みの `BattleLog` を取得。
- `game` — Phaser.Game インスタンス（描画デバッグ用）。

## 更新周期

- **シミュレーション**: `tickRate`（デフォルト 60Hz）で固定ステップ進行。描画 FPS に依存しない。
- **描画**: `requestAnimationFrame` に応じて最大 60FPS で再生。ログが尽きたら停止。
- **ログ長**: デフォルトは 60 秒上限。拡張時は `simulateBattle` の `maxSeconds` で制御。

## 設計方針

- **決定論**: `Mulberry32` 乱数と完全なログ保存で同じ入力から同じ結果を保証。
- **疎結合**: シミュレーションは Phaser を知らず、描画はログの状態取得のみ行う。
- **型安全性**: グローバル API を含む公開インターフェースは TypeScript で厳密に定義。
- **デバッグ性**: `window.$orbi` と Vitest を併用し、ロジック／描画／UI を独立検証。

## 拡張ポイント

- **AI 拡張** — `src/sim/ai` に戦略を追加し、プリセットや UI から参照。
- **イベント配信** — BattleSim からイベントをフックしてエフェクトや HUD を強化。
- **パフォーマンス** — フレーム間引き・差分ログ・Web Worker 前計算を検討中。
