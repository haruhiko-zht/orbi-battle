# アーキテクチャ

## レイヤー構造

```
┌─────────────────────────────────────┐
│         UI Layer (HTML/CSS)         │  ← デバッグパネル
├─────────────────────────────────────┤
│    Rendering Layer (Phaser)         │  ← 描画・アニメーション
├─────────────────────────────────────┤
│   Simulation Layer (Pure Logic)     │  ← ゲームロジック
├─────────────────────────────────────┤
│     Config & Types (Shared)         │  ← 型定義・設定
└─────────────────────────────────────┘
```

```
[Engine] → [simulateBattle] → [BattleLog]
                                    ↓
                              [BattleSim]
                                    ↓
                        [BattleRuntimeController]
                                    ↓
                          [PhaserScene] ←→ [UI(DebugPanel)]
```

## ディレクトリ構成

```
src/
├── main.ts              # エントリーポイント
├── config/              # 設定
│   └── defaults.ts      # デフォルトパラメータ
├── sim/                 # シミュレーション層
│   ├── types.ts         # 型定義
│   ├── rng.ts           # 乱数生成器
│   ├── engine.ts        # コアロジック
│   ├── battle.ts        # シミュレーター
│   ├── log.ts           # ログ記録
│   └── fighter.ts       # (将来の拡張用)
├── render/              # 描画層
│   ├── battleRuntimeController.ts # BattleSimとの橋渡しとwindow.$orbi公開
│   ├── phaserScene.ts   # Phaserシーン（描画専任）
│   ├── playbackController.ts # 再生速度・フレーム制御
│   └── battleLayers.ts  # Fighter/HP描画ユーティリティ
└── ui/                  # UI層
    ├── debugPanel.tsx   # Reactベースのデバッグパネル
    └── api/orbiBridge.ts # window.$orbi の安全な呼び出しラッパー
```

## データフロー

### 1. 初期化フロー

```
main.ts
  ├─→ Phaser.Game 生成
  │    └─→ BattleScene.create()
  │         └─→ new BattleRuntimeController(defaults)
  │              └─→ BattleSim(defaults)
  │                   └─→ simulateBattle()
  │                        └─→ Engine.update() × N回
  │                             └─→ BattleLog 生成
  └─→ createDebugPanel(defaults)
       └─→ window.$orbi API 公開
```

### 2. 再生フロー (毎フレーム)

```
Phaser requestAnimationFrame
  └─→ BattleScene.update(delta)
       └─→ BattleRuntimeController.update(delta)
            └─→ BattlePlaybackController.update()
                 └─→ BattleSim.step()/getCurrentState()
                      └─→ BattleScene.renderState()
                           └─→ 描画更新
```

### 3. リセットフロー

```
DebugPanel [Restart]
  └─→ window.$orbi.reset(newConfig)
       └─→ BattleRuntimeController.reset(newConfig)
            └─→ BattleSim.reset()
                 └─→ simulateBattle(newConfig)
                      └─→ BattleLog 再生成
                         └─→ hooks.onSimulationReset → BattleScene.renderState()
```

### 4. グローバル API (`window.$orbi`)

- `BattleRuntimeController` が `reset / play / pause / stepFrame / seekFrame / setPlaybackRate / getPlaybackInfo / getLog` を公開
- UI 層（`ui/api/orbiBridge.ts`）は安全にラップし、存在チェックや undefined 対策を担当
- Phaser シーン側では API 公開後も描画のみに集中できる

## 更新周期

- **固定 Tick**: `tickRate`（既定値 60Hz）でシミュレーションを進める
- **描画更新**: `requestAnimationFrame` を利用し最大 60FPS で描画
- `BattleSim.fixedUpdate()` が内部バッファを持ち、描画フレームレートに依存せずロジックを前進

## 設計方針

### 分離の原則

- **シミュレーション層**: 描画に依存しない純粋なロジック
  - テスト可能
  - サーバーでも実行可能
  - 決定論的動作

- **描画層**: 状態を受け取って描画するだけ
  - シミュレーションを変更せず
  - フレームレートに依存しない
  - 演出を自由に追加可能

### 事前シミュレーション方式

- メリット:
  - リプレイが簡単
  - デバッグしやすい
  - サーバー検証が容易
  - 早送り・巻き戻しが可能

- デメリット:
  - メモリ使用量が増加
  - 長時間バトルは計算コスト高

- 対策:
  - 最大時間制限（現在 60 秒）
  - 将来的にフレーム間引きや差分記録を検討

### 固定タイムステップ

- `tickRate` で更新頻度を設定（例: 60Hz = 1/60 秒ごと）
- 描画フレームレートとは独立
- ゲームスピードが安定

## 拡張ポイント

### 1. AI 拡張 (`fighter.ts`)

```typescript
interface FighterAI {
  decide(self: FighterState, enemy: FighterState): Action;
}
```

### 2. イベントシステム

```typescript
type BattleEvent =
  | { type: "attack"; from: "A" | "B"; damage: number }
  | { type: "move"; id: "A" | "B"; pos: Vec2 }
  | { type: "death"; id: "A" | "B" };
```

### 3. エフェクトシステム

```typescript
class EffectManager {
  playAttack(pos: Vec2): void;
  playDeath(pos: Vec2): void;
}
```

### 4. サーバー連携

```typescript
// ログをサーバーに送信
POST /battles { config, log }

// サーバーで検証・保存
// クライアントはログを再生
```

## 型安全性

- すべての公開 API に型定義
- `BattleConfig`, `BattleState`, `BattleLog` は immutable 前提
- `structuredClone()` で深いコピー
- `window.$orbi` は現在 `@ts-expect-error` だが、将来的にグローバル型定義を追加予定

## パフォーマンス考慮

### 現状

- 60Hz × 60 秒 = 3600 フレーム
- 1 フレーム ≈ 200 バイト → 約 700KB
- メモリ・計算ともに問題なし

### 最適化案（将来）

1. **フレーム間引き**: 変化がないフレームはスキップ
2. **差分記録**: 前フレームとの差分のみ保存
3. **非同期計算**: Web Worker で事前計算
4. **圧縮**: MessagePack 等でシリアライズ
