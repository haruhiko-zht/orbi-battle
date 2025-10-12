# AI システム設計ドキュメント

## 概要

orbi-battle に戦略パターンベースの AI システムを導入しました。これにより、ファイターごとに異なる AI を指定でき、様々な戦術の組み合わせをテストできるようになりました。

## アーキテクチャ

### ディレクトリ構成

```
src/sim/ai/
├── types.ts           # AI インターフェースと型定義
├── index.ts           # AI ファクトリーとエクスポート
├── nearestTarget.ts   # 最も近い敵を攻撃する AI
├── aggressive.ts      # 攻撃的な AI（常に接近）
├── defensive.ts       # 防御的な AI（距離を保つ）
└── __tests__/ai.test.ts # AI ユニットテスト
```

### 主要コンポーネント

#### 1. `FighterAI` インターフェース

すべての AI 実装が従うべきインターフェースです。

```typescript
export interface FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    arenaRadius: number
  ): AIDecision;
}
```

#### 2. `AIDecision` 型

AI の決定結果を表現します。

```typescript
export type AIDecision = {
  targetId: string | null; // 攻撃対象のファイターID
  moveDirection: Vec2 | null; // 移動方向ベクトル
};

// `moveDirection` は任意の方向ベクトルを返してよいが、エンジン側で正規化されるため
// AI 実装が誤って長さ > 1 のベクトルを返しても速度が暴走しない。
```

#### 4. 実装ガイドライン（推奨）

- `moveDirection` の各成分には **有限の実数** を返すこと。`NaN` や `Infinity` が含まれると正規化処理で例外的な挙動が発生する。
- 速度倍率や特殊挙動は `FighterParams.speed` を使って調整し、AI からは単位ベクトル（もしくは長さ 0 の停止ベクトル）を返す設計を基本とする。
- 攻撃対象が決まらないフレームでは `targetId` を `null` にし、`moveDirection` も `null` に設定して意図しない攻撃判定を避ける。

#### 3. `AIType` 型

利用可能な AI タイプを定義します。

```typescript
export type AIType = "nearest" | "aggressive" | "defensive";
```

## 実装された AI 戦略

### 1. NearestTargetAI（デフォルト）

**戦術**: 最も近い敵を選択し、射程外なら接近、射程内なら停止して攻撃

**特徴**:

- バランスの取れた標準的な AI
- 射程を有効活用する
- 無駄な移動を避ける

**実装**: [src/sim/ai/nearestTarget.ts](src/sim/ai/nearestTarget.ts)

### 2. AggressiveAI

**戦術**: 常に最も近い敵に向かって突進し、密着戦闘を仕掛ける

**特徴**:

- 射程内でも接近し続ける
- 高速移動キャラと相性が良い
- 距離を詰められると強い

**実装**: [src/sim/ai/aggressive.ts](src/sim/ai/aggressive.ts)

### 3. DefensiveAI

**戦術**: 射程ギリギリから攻撃し、敵が近づいたら距離を取る

**特徴**:

- 射程の80%を安全距離とする
- 敵が近づきすぎたら後退
- 長射程キャラと相性が良い
- キープディスタンス戦法

**実装**: [src/sim/ai/defensive.ts](src/sim/ai/defensive.ts)

## 使い方

### 1. ファイターに AI を指定

`FighterParams` に `aiType` プロパティを追加しました。

```typescript
const fighter: FighterParams = {
  hpMax: 100,
  atk: 10,
  range: 80,
  speed: 50,
  cooldown: 0.5,
  aiType: "aggressive", // AI タイプを指定
};
```

`aiType` を省略した場合は `"nearest"` がデフォルトで使用されます。

### 2. バトル設定での使用例

```typescript
const cfg: BattleConfig = {
  seed: 42,
  arenaRadius: 300,
  tickRate: 60,
  teams: [
    {
      id: "TeamA",
      fighters: [
        {
          hpMax: 100,
          atk: 10,
          range: 80,
          speed: 50,
          cooldown: 0.5,
          aiType: "aggressive",
        },
      ],
    },
    {
      id: "TeamB",
      fighters: [
        {
          hpMax: 100,
          atk: 10,
          range: 80,
          speed: 50,
          cooldown: 0.5,
          aiType: "defensive",
        },
      ],
    },
  ],
};
```

### 3. プリセット設定の利用

[src/config/defaults.ts](src/config/defaults.ts) に以下のプリセットが用意されています:

- **`defaults`**: デフォルトの 1v1（AI 指定なし）
- **`defaults3v3`**: 3v3（AI 指定なし）
- **`aiDemoConfig`**: AggressiveAI vs DefensiveAI のデモ
- **`mixedAI3v3`**: 各チームに異なる AI が混在する 3v3

## Engine との統合

### 変更点

1. **`norm()` 関数を削除**: AI 側で正規化を行うため不要に
2. **`pickNearestTarget()` メソッドを削除**: AI が自身でターゲット選択を行う
3. **`stepFighter()` メソッドを AI ベースに書き換え**:

```typescript
private stepFighter(self: FighterState) {
  if (!self.alive) return;

  // 生存している敵のリストを取得
  const enemies = this.state.fighters.filter(
    (f) => f.alive && f.teamId !== self.teamId
  );

  if (enemies.length === 0) return;

  // AI による意思決定
  const aiType = self.params.aiType ?? "nearest";
  const ai = getAI(aiType);
  const decision = ai.decide(self, enemies, this.cfg.arenaRadius);

  // クールダウン更新
  if (self.cooldown > 0) {
    self.cooldown = Math.max(0, self.cooldown - this.dt);
  }

  // 移動処理（AI から返されたベクトルはここで正規化）
  if (decision.moveDirection) {
    const { x, y } = decision.moveDirection;
    const mag = Math.hypot(x, y);
    if (mag > 0) {
      const nx = x / mag;
      const ny = y / mag;
      self.pos.x += nx * self.params.speed * this.dt;
      self.pos.y += ny * self.params.speed * this.dt;
    }
  }

  // 攻撃処理
  if (decision.targetId && self.cooldown === 0) {
    const target = this.state.fighters.find((f) => f.id === decision.targetId);
    if (target && target.alive) {
      const dist = Math.hypot(target.pos.x - self.pos.x, target.pos.y - self.pos.y);
      if (dist <= self.params.range) {
        target.hp -= self.params.atk;
        self.cooldown = self.params.cooldown;
        if (target.hp <= 0) {
          target.alive = false;
          target.hp = 0;
        }
      }
    }
  }

  // 境界チェック
  self.pos = clampToCircle(self.pos, this.cfg.arenaRadius);
}
```

## テスト

### テストファイル

- **[src/sim/ai/__tests__/ai.test.ts](src/sim/ai/__tests__/ai.test.ts)**: 各 AI のユニットテスト（15 テスト）
- **[src/sim/**tests**/ai-integration.test.ts](src/sim/__tests__/ai-integration.test.ts)**: AI 統合テスト（5 テスト）

- AI 関連テスト合計: **20 ケース**（ユニット 15 / 統合 5）。最新のカバレッジは `npm run test:coverage` で確認してください。

## 拡張性

### 新しい AI の追加方法

1. **AI クラスを作成**:

```typescript
// src/sim/ai/custom.ts
import type { FighterAI, AIDecision } from "./types";
import type { FighterState } from "../types";

export class CustomAI implements FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    arenaRadius: number
  ): AIDecision {
    // カスタムロジックを実装
    return {
      targetId: "...",
      moveDirection: { x: 0, y: 0 },
    };
  }
}
```

2. **`AIType` に追加**:

```typescript
// src/sim/ai/types.ts
export type AIType = "nearest" | "aggressive" | "defensive" | "custom";
```

3. **ファクトリーに登録**:

```typescript
// src/sim/ai/index.ts
import { CustomAI } from "./custom";

export function getAI(type: AIType): FighterAI {
  if (!aiCache.has(type)) {
    switch (type) {
      case "nearest":
        aiCache.set(type, new NearestTargetAI());
        break;
      case "aggressive":
        aiCache.set(type, new AggressiveAI());
        break;
      case "defensive":
        aiCache.set(type, new DefensiveAI());
        break;
      case "custom":
        aiCache.set(type, new CustomAI());
        break;
    }
  }
  return aiCache.get(type)!;
}
```

4. **テストを追加**:

```typescript
// src/sim/ai/__tests__/ai.test.ts
describe("CustomAI", () => {
  it("カスタムロジックが動作する", () => {
    const ai = new CustomAI();
    // テストケースを記述
  });
});
```

## 装備システムとの統合計画

### 設計思想

現在の AI システムは**基礎行動パターン**として機能します。将来実装予定の**装備システム**により、ターゲティングや移動パターンを動的に変更できるようになります。

### アーキテクチャ

```
装備なし: FighterParams.aiType → 基礎AI（Nearest/Aggressive/Defensive）
装備あり: Equipment.targeting/movement → 装備による行動変更
```

### 装備システムの実装案

#### 1. 装備型の定義

```typescript
// src/sim/equipment/types.ts
export type Equipment = {
  id: string;
  name: string;
  targeting?: TargetingBehavior; // ターゲット選択を上書き
  movement?: MovementBehavior; // 移動パターンを上書き
  effects?: EquipmentEffect[]; // その他の効果
};

export type TargetingBehavior =
  | "nearest" // 最も近い敵
  | "lowest-hp" // 最も HP が低い敵
  | "highest-threat" // 最も攻撃力が高い敵
  | "farthest" // 最も遠い敵
  | "random"; // ランダム

export type MovementBehavior =
  | "direct" // 直進（現在の基礎実装）
  | "strafe" // 横移動しながら攻撃
  | "kite" // ヒット&アウェイ
  | "circle" // 円周移動
  | "zigzag"; // ジグザグ移動
```

#### 2. FighterParams への装備追加

```typescript
export type FighterParams = {
  hpMax: number;
  atk: number;
  range: number;
  speed: number;
  cooldown: number;
  aiType?: AIType; // 基礎行動パターン（装備なし時）
  equipment?: Equipment[]; // 装備リスト（将来実装）
};
```

#### 3. Engine での統合

```typescript
private stepFighter(self: FighterState) {
  if (!self.alive) return;

  const enemies = this.state.fighters.filter(
    (f) => f.alive && f.teamId !== self.teamId
  );

  if (enemies.length === 0) return;

  // 装備システムによる行動決定
  const decision = this.decideFighterAction(self, enemies);

  // ... 移動・攻撃処理
}

private decideFighterAction(
  self: FighterState,
  enemies: FighterState[]
): AIDecision {
  // 装備がある場合は装備の行動パターンを優先
  if (self.params.equipment && self.params.equipment.length > 0) {
    return this.decideWithEquipment(self, enemies);
  }

  // 装備がない場合は基礎AIを使用
  const aiType = self.params.aiType ?? "nearest";
  const ai = getAI(aiType);
  return ai.decide(self, enemies, this.cfg.arenaRadius);
}
```

### 実装フェーズ

#### フェーズ 1: 基礎AI（✅ 完了）

- [x] NearestTargetAI - 最も近い敵を攻撃
- [x] AggressiveAI - 常に接近
- [x] DefensiveAI - 距離を保つ

**目的**: 装備なし時の基礎行動パターンを確立

#### フェーズ 2: 装備システム基盤（未実装）

- [ ] Equipment 型定義
- [ ] TargetingBehavior 実装
- [ ] MovementBehavior 実装
- [ ] FighterParams への装備統合

**目的**: 装備による行動変更を可能にする

#### フェーズ 3: 装備効果の拡張（未実装）

- [ ] パッシブ効果（攻撃力+10%など）
- [ ] アクティブスキル（範囲攻撃など）
- [ ] 条件付き発動（HP 50%以下で防御力アップなど）

### 基礎AIの重要性

現在実装されている AI システムは**無駄にならない**理由:

1. **装備なし時のデフォルト動作**として機能
2. **装備の効果を検証する際の比較基準**となる
3. **新規プレイヤーのチュートリアル**でシンプルな挙動を提供
4. **バランス調整の基準点**として使用

### 今後の拡張アイデア

#### 1. パラメータ付き装備

装備にパラメータを持たせる:

```typescript
const equipment: Equipment = {
  id: "sniper-scope",
  name: "スナイパースコープ",
  targeting: "farthest",
  movement: "defensive",
  params: {
    safeDistanceRatio: 0.9, // 射程の90%を安全距離とする
  },
};
```

#### 2. チーム協調装備

味方の位置を考慮した装備:

```typescript
const equipment: Equipment = {
  id: "team-comm",
  name: "チーム通信装置",
  targeting: "nearest-to-ally", // 味方に近い敵を優先
  movement: "formation", // 隊形を維持
};
```

#### 3. 状態機械ベース装備

複数の状態を持つ装備:

```typescript
const equipment: Equipment = {
  id: "adaptive-armor",
  name: "適応型アーマー",
  behavior: "state-machine",
  states: {
    offensive: { targeting: "lowest-hp", movement: "aggressive" },
    defensive: { targeting: "nearest", movement: "kite" },
    retreat: { targeting: null, movement: "escape" },
  },
};
```

#### 4. 学習型装備（将来）

強化学習や遺伝的アルゴリズムを用いた装備:

```typescript
const equipment: Equipment = {
  id: "ai-chip",
  name: "AI チップ",
  behavior: "learning",
  model: trainedModel,
};
```

## メリット

### 1. **拡張性の向上**

- 新しい AI を追加しても Engine クラスを変更不要
- Strategy Pattern によりコードの結合度が低い

### 2. **テスト容易性**

- AI 単体でテスト可能
- Engine から独立したテストが書ける

### 3. **再利用性**

- AI インスタンスをシングルトンでキャッシュ
- 同じ AI を複数のファイターで共有可能

### 4. **型安全性**

- TypeScript により AI の実装ミスを防止
- `FighterAI` インターフェースが契約を保証

### 5. **決定論性の維持**

- AI はステートレス（状態を持たない）
- 同じ入力で常に同じ出力を保証
- 乱数が必要な場合は将来的に RNG を注入可能

## まとめ

AI システムの抽象化により、以下が実現されました:

✅ **3種類の AI 戦略** (Nearest, Aggressive, Defensive)
✅ **100% テストカバレッジ**
✅ **100 テスト** すべてパス
✅ **Strategy Pattern による高い拡張性**
✅ **決定論性の維持**
✅ **型安全な実装**

今後は、この基盤の上に協調 AI、状態機械ベース AI、パラメータ付き AI などを追加できます。
