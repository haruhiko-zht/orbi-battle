# シミュレーション仕様

## 構造

- **Fighter**: 行動主体（A/B）
- **BattleState**: 双方の位置・HP・勝敗状態
- **Engine**: 時間更新・勝敗判定を制御

## 行動ルール

1. 距離 > range → 敵に向かって移動
2. 距離 ≤ range → cooldown=0 なら攻撃
3. HP ≤ 0 → 敗北判定

## パラメータ

| 名称     | 意味     | 単位    |
| -------- | -------- | ------- |
| hpMax    | 最大 HP  | -       |
| atk      | 攻撃力   | HP 単位 |
| range    | 攻撃射程 | px      |
| speed    | 移動速度 | px/s    |
| cooldown | 攻撃間隔 | 秒      |

## 決定論

- `seed` に基づく乱数生成 (Mulberry32)
- 同じパラメータ + seed で同結果
