# AI システムガイド

ファイターごとに異なる戦略を割り当て、決定論を保ちつつ挙動を差別化します。

## ディレクトリ

```
src/sim/ai/
├── types.ts        # 型定義とレジストリ (AI_DEFINITIONS)
├── index.ts        # ファクトリー & 実行エントリ
├── nearestTarget.ts
├── aggressive.ts
├── defensive.ts
└── __tests__/ai.test.ts
```

## 主要インターフェース

```ts
export interface FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    arenaRadius: number
  ): AIDecision;
}

export type AIDecision = {
  targetId: string | null;
  moveDirection: Vec2 | null;
};
```

- `moveDirection` はエンジン側で正規化されるが、有限の数値を返すこと。
- `targetId` / `moveDirection` を `null` にすると攻撃・移動を抑制できる。

## 既存戦略

| ID           | 概要                                 | 主な用途                           |
| ------------ | ------------------------------------ | ---------------------------------- |
| `nearest`    | 最短距離の敵へ接近し、射程内で停止。 | デフォルトの万能型。               |
| `aggressive` | 射程内でも距離を詰め続ける。         | 近接ラッシュ、速度重視構成。       |
| `defensive`  | 射程 80% を安全距離とし後退を優先。  | 長射程、ヒット・アンド・アウェイ。 |

## AI の追加手順

1. `AI_DEFINITIONS` に `{ 新ID: { label: "表示名" } }` を追加。
2. `src/sim/ai/index.ts` に `aiFactories[newId] = () => new CustomAI()` を登録。
3. 必要なら `src/config/defaults.ts` のプリセットや UI で `aiType` を指定。
4. `__tests__/ai.test.ts` にケースを追加して決定論を確認。

`validation.ts` が未登録の ID を弾くため、定義と実装を同時に更新すること。

## 利用例

```ts
const fighter: FighterParams = {
  hpMax: 120,
  atk: 10,
  range: 9,
  speed: 75,
  cooldown: 0.45,
  aiType: "aggressive",
};
```

`aiType` を省略すると `nearest` が自動適用されます。プリセットでは `aiDemoConfig` や `mixedAI3v3` で 3 種類の挙動を比較できます。
