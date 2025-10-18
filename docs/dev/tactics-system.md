# 戦術システムガイド

ファイターごとに戦術 (`tacticId`) を割り当て、決定論を保ちながら挙動を差別化します。

## ディレクトリ構成

```
src/sim/tactics/
├── types.ts        # 型定義と TACTIC_DEFINITIONS / OPTIONS
├── index.ts        # 実装登録 (tacticFactories)
├── nearestTarget.ts
├── aggressive.ts
├── defensive.ts
└── __tests__/tactics.test.ts
```

## 主要インターフェース

```ts
export interface FighterTactic {
  decide(
    self: FighterState,
    enemies: FighterState[],
    arenaRadius: number
  ): TacticDecision;
}

export type TacticDecision = {
  targetId: string | null;
  moveDirection: Vec2 | null;
};
```

- `moveDirection` はエンジン側で正規化されますが、有限の数値を返してください。
- `targetId` / `moveDirection` を `null` にすると攻撃・移動を抑制できます。

## 既存戦略

| ID           | 概要                                 | 用途                           |
| ------------ | ------------------------------------ | ------------------------------ |
| `nearest`    | 最短距離の敵へ接近し、射程内で停止。 | デフォルトの汎用型。           |
| `aggressive` | 射程内でも距離を詰め続ける。         | 近接ラッシュ・高 DPS 編成。    |
| `defensive`  | 射程 80% を安全距離とし後退を優先。  | ヒット・アンド・アウェイ構成。 |

## 追加手順

1. `TACTIC_DEFINITIONS` に `{ 新ID: { label: "表示名" } }` を追加。
2. `src/sim/tactics/index.ts` で `tacticFactories[newId]` を登録。
3. 必要なら `src/config/defaults.ts` のプリセットや UI に `tacticId` を設定。
4. `__tests__/tactics.test.ts` へケースを追加し、決定論を確認。

`validation.ts` が未登録 ID を拒否するため、定義と実装は同じブランチで更新してください。

## 利用例

```ts
const fighter: FighterParams = {
  hpMax: 120,
  atk: 10,
  range: 9,
  speed: 75,
  cooldown: 0.45,
  tacticId: "aggressive",
};
```

`tacticId` を省略すると `nearest` が自動適用されます。`tacticsDemoConfig` や `mixedTactics3v3` で挙動比較が可能です。
