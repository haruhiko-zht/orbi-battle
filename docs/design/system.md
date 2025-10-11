# システム全体設計

## 構成

```
[BattleSim] ←→ [PhaserScene] ←→ [UI(DebugPanel)]
```

- **BattleSim**: 状態を固定タイムステップで進行。描画に依存しない。
- **PhaserScene**: `BattleState`を描画。毎フレーム更新。
- **DebugPanel**: パラメータを入力 →`window.$orbi.reset()`で再初期化。

## 更新周期

- 固定 Tick: `tickRate` = 60Hz
- 描画: requestAnimationFrame（最大 60FPS）

## データフロー

1. パネルで設定変更
2. `BattleSim.reset(config)` 実行
3. `Engine.update()` により 1tick 進行
4. Scene が `BattleState` を描画へ反映
