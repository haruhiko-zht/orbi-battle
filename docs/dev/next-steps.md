# 次のステップガイド

このドキュメントは、今すぐ着手できるタスクの詳細な実装ガイドです。

---

## ✅ 完了済み

### フェーズ 0.1: 型安全性の向上 ✅

- [x] `src/types/global.d.ts` でグローバル型定義を追加
- [x] `@ts-expect-error` を削減（3 箇所すべて対応）
- [x] TypeScript コンパイルエラーゼロを確認

### フェーズ 0.2: テスト環境整備 ✅

- [x] Vitest セットアップ完了
- [x] 80 テスト実装、96%カバレッジ達成

### フェーズ 0.3: コード品質改善（部分完了）

- [x] Prettier セットアップ完了
  - `.prettierrc` 設定ファイル作成
  - `.prettierignore` 作成
  - `npm run format` / `npm run format:check` スクリプト追加

---

## 🎯 次にやるべきこと

### オプション 1: フェーズ 0.3 完了 - コード品質改善

残りのタスク：

#### タスク 1: tsconfig.json の厳密化

**現在の設定**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext"
    // ...
  }
}
```

**推奨設定**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**注意**: strict 有効化でエラーが出る可能性あり。一つずつ対応。

---

#### タスク 2: マジックナンバーの定数化

**例: `src/render/phaserScene.ts`**

変更前:

```typescript
const w = 320,
  h = 8;
const pad = 2;
this.add.circle(cx, cy, 10, color);
```

変更後:

```typescript
// src/config/renderConstants.ts を作成
export const RENDER_CONSTANTS = {
  HP_BAR_WIDTH: 320,
  HP_BAR_HEIGHT: 8,
  HP_BAR_PADDING: 2,
  FIGHTER_RADIUS: 10,
  COLOR_ARENA_STROKE: 0x4a90e2,
} as const;
```

---

#### タスク 3: エラーハンドリング追加

**例: `src/sim/battle.ts`**

```typescript
export function simulateBattle(
  cfg: BattleConfig,
  opts?: { maxSeconds?: number }
): BattleLog {
  // バリデーション追加
  if (cfg.tickRate <= 0) {
    throw new Error("tickRate must be positive");
  }
  if (cfg.arenaRadius <= 0) {
    throw new Error("arenaRadius must be positive");
  }

  // 既存のロジック...
}
```

---

### オプション 2: フェーズ 2.1 - AI システムの抽象化 🤖

基礎固めが完了したので、機能拡張に進む選択肢もあります。

#### AI インターフェース定義

```typescript
// src/sim/ai/types.ts
export interface FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    arena: { radius: number }
  ): AIDecision;
}

export type AIDecision = {
  targetId: string | null; // 攻撃対象
  moveDirection: Vec2 | null; // 移動方向
};
```

#### 複数 AI 実装

```typescript
// src/sim/ai/aggressive.ts
export class AggressiveAI implements FighterAI {
  decide(self, enemies, arena) {
    // 最も近い敵に向かって接近
    const nearest = findNearest(self, enemies);
    return {
      targetId: nearest.id,
      moveDirection: directionTo(self.pos, nearest.pos),
    };
  }
}

// src/sim/ai/defensive.ts
export class DefensiveAI implements FighterAI {
  decide(self, enemies, arena) {
    // 距離を保ちながら攻撃
    const nearest = findNearest(self, enemies);
    const distance = getDistance(self.pos, nearest.pos);
    if (distance < self.params.range * 1.5) {
      // 離れる
      return {
        targetId: nearest.id,
        moveDirection: directionAway(self.pos, nearest.pos),
      };
    }
    return {
      targetId: nearest.id,
      moveDirection: null,
    };
  }
}
```

---

### オプション 3: フェーズ 2.2 - 戦闘システム拡張 ⚔️

#### 攻撃範囲の可視化

```typescript
// src/render/phaserScene.ts に追加
private renderAttackRange(fighter: FighterState) {
  const range = this.add.circle(
    cx + fighter.pos.x,
    cy + fighter.pos.y,
    fighter.params.range,
    0xffffff,
    0.1
  );
  range.setStrokeStyle(1, 0xffffff, 0.3);
}
```

#### 回避行動の実装

```typescript
// src/sim/types.ts に追加
export type FighterParams = {
  hpMax: number;
  atk: number;
  range: number;
  speed: number;
  cooldown: number;
  evasion: number; // 0-1 の回避率
};

// src/sim/engine.ts で回避判定
const evaded = rng.next() < target.params.evasion;
if (!evaded) {
  target.hp -= attacker.params.atk;
}
```

---

## 🚀 推奨する実行順序

1. **完璧主義ルート**: オプション 1 → フェーズ 0 完全制覇 → フェーズ 2 へ
2. **機能開発優先ルート**: オプション 2 or 3 → 新機能を追加しながら品質改善
3. **バランスルート**: マジックナンバー定数化のみ実施 → フェーズ 2 へ

すべて完了したら、**フェーズ 2: シミュレーション拡張** で本格的な機能追加に進みましょう！
