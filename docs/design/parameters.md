# パラメータ設計

## デフォルト値

```ts
hpMax: 120;
atk: 10;
range: 36;
speed: 75;
cooldown: 0.45;
```

## バランス基準

- `speed * cooldown ≈ range / 2` で安定挙動。
- 攻撃力(ATK)を 2 倍 → 戦闘時間が半分に。
- HP を増やすと長期戦・観戦向き。

## 今後の候補

- 攻撃半径 (attackRadius)
- 回避スキル (dash)
- 命中率・クリティカル
