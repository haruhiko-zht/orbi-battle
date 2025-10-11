# システム全体設計

## 構成

```
[Engine] → [simulateBattle] → [BattleLog]
                                    ↓
                              [BattleSim] ←→ [PhaserScene] ←→ [UI(DebugPanel)]
```

- **Engine**: シミュレーションコアロジック（ミュータブルな状態更新）
- **simulateBattle()**: バトル全体を事前計算してログ生成
- **BattleLog**: 全フレームの記録（設定 + frames[]）
- **BattleSim**: ログを固定タイムステップで再生。描画に依存しない。
- **PhaserScene**: `BattleState`を描画。毎フレーム更新。
- **DebugPanel**: パラメータを入力 →`window.$orbi.reset()`で再初期化。

## 更新周期

- 固定 Tick: `tickRate` = 60Hz
- 描画: requestAnimationFrame（最大 60FPS）

## データフロー

### 初期化・リセット時

1. パネルで設定変更 → Restart ボタン
2. `BattleScene.reset(config)` 呼び出し
3. `BattleSim.reset(config)` 実行
4. `simulateBattle(config)` で全フレーム事前計算
5. `BattleLog` 生成完了

### 再生中

1. `PhaserScene.update()` が毎フレーム呼ばれる
2. `BattleSim.fixedUpdate(dt)` でフレームを進める
3. ログから対応するフレームを取得
4. `BattleState` を描画に反映
