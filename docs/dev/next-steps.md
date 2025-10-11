# 次のステップガイド

このドキュメントは、今すぐ着手できるタスクの詳細な実装ガイドです。

---

## 🎯 フェーズ 0.1: 型安全性の向上

### タスク 1: グローバル型定義ファイルの追加

**目的**: `window.$orbi` の型安全性を確保

**手順**:

1. `src/types/global.d.ts` を作成

```typescript
import type { BattleConfig } from "../sim/types";
import type { BattleLog } from "../sim/log";
import type Phaser from "phaser";

declare global {
  interface Window {
    $orbi: {
      game: Phaser.Game;
      reset: (cfg: BattleConfig) => void;
      getLog: () => BattleLog;
    };
  }
}

export {};
```

2. `src/main.ts`, `src/render/phaserScene.ts`, `src/ui/debugPanel.ts` から `@ts-expect-error` を削除

3. 動作確認

```typescript
// コンソールで型チェックされることを確認
window.$orbi.reset(/* ... */);
window.$orbi.getLog();
```

**期待される効果**: エディタで補完が効くようになり、型エラーを事前検知

---

### タスク 2: tsconfig.json の厳密化

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

## 🧪 フェーズ 0.2: テスト環境整備

### タスク 1: Vitest のセットアップ

**インストール**:

```bash
npm install -D vitest @vitest/ui
```

**package.json にスクリプト追加**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**vite.config.ts に設定追加**:

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

---

### タスク 2: 最初のテストを書く

**`src/sim/__tests__/engine.test.ts` を作成**:

```typescript
import { describe, it, expect } from "vitest";
import { Engine } from "../engine";
import type { BattleConfig } from "../types";

describe("Engine", () => {
  const defaultConfig: BattleConfig = {
    seed: 12345,
    arenaRadius: 200,
    tickRate: 60,
    fighterA: {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    },
    fighterB: {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    },
  };

  it("初期状態が正しく設定される", () => {
    const engine = new Engine(defaultConfig);

    expect(engine.state.t).toBe(0);
    expect(engine.state.winner).toBeNull();
    expect(engine.state.a.hp).toBe(100);
    expect(engine.state.b.hp).toBe(100);
    expect(engine.state.a.alive).toBe(true);
    expect(engine.state.b.alive).toBe(true);
  });

  it("決定論的動作: 同じシードで同じ結果", () => {
    const engine1 = new Engine(defaultConfig);
    const engine2 = new Engine(defaultConfig);

    // 100フレーム進める
    for (let i = 0; i < 100; i++) {
      engine1.update();
      engine2.update();
    }

    expect(engine1.state.a.hp).toBe(engine2.state.a.hp);
    expect(engine1.state.b.hp).toBe(engine2.state.b.hp);
    expect(engine1.state.a.pos).toEqual(engine2.state.a.pos);
    expect(engine1.state.b.pos).toEqual(engine2.state.b.pos);
  });

  it("ファイターがアリーナ外に出ない", () => {
    const engine = new Engine(defaultConfig);

    for (let i = 0; i < 1000; i++) {
      engine.update();

      const distA = Math.hypot(engine.state.a.pos.x, engine.state.a.pos.y);
      const distB = Math.hypot(engine.state.b.pos.x, engine.state.b.pos.y);

      expect(distA).toBeLessThanOrEqual(defaultConfig.arenaRadius + 0.01);
      expect(distB).toBeLessThanOrEqual(defaultConfig.arenaRadius + 0.01);
    }
  });
});
```

**実行**:

```bash
npm test
```

---

### タスク 3: スナップショットテスト

**`src/sim/__tests__/battle.test.ts` を作成**:

```typescript
import { describe, it, expect } from "vitest";
import { simulateBattle } from "../battle";
import type { BattleConfig } from "../types";

describe("simulateBattle", () => {
  const config: BattleConfig = {
    seed: 99999,
    arenaRadius: 220,
    tickRate: 60,
    fighterA: {
      hpMax: 120,
      atk: 10,
      range: 36,
      speed: 75,
      cooldown: 0.45,
    },
    fighterB: {
      hpMax: 120,
      atk: 10,
      range: 36,
      speed: 75,
      cooldown: 0.45,
    },
  };

  it("バトルログが正しく生成される", () => {
    const log = simulateBattle(config);

    expect(log.version).toBe(1);
    expect(log.config).toEqual(config);
    expect(log.frames.length).toBeGreaterThan(0);
    expect(log.frames[0].t).toBe(0);
  });

  it("勝者が決まる", () => {
    const log = simulateBattle(config, { maxSeconds: 30 });
    const lastFrame = log.frames[log.frames.length - 1];

    // 30秒以内に決着がつく想定
    expect(lastFrame.winner).not.toBeNull();
  });

  it("ログの一貫性（スナップショット）", () => {
    const log = simulateBattle(config, { maxSeconds: 5 });

    // 最終フレームをスナップショット
    expect(log.frames[log.frames.length - 1]).toMatchSnapshot();
  });
});
```

---

## 📝 フェーズ 0.3: コード品質改善

### タスク 1: ESLint + Prettier セットアップ

**インストール**:

```bash
npm install -D eslint prettier eslint-config-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**`.eslintrc.json` 作成**:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ]
  }
}
```

**`.prettierrc` 作成**:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**package.json にスクリプト追加**:

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'"
  }
}
```

---

### タスク 2: マジックナンバーの定数化

**例: `src/render/phaserScene.ts`**

変更前:

```typescript
const w = 320,
  h = 8;
const pad = 6;
this.a = this.add.circle(cx - this.cfg.arenaRadius * 0.7, cy, 10, 0x7bd389);
```

変更後:

```typescript
// src/config/renderConstants.ts を作成
export const RENDER_CONSTANTS = {
  HP_BAR_WIDTH: 320,
  HP_BAR_HEIGHT: 8,
  HP_BAR_PADDING: 6,
  FIGHTER_RADIUS: 10,
  FIGHTER_INITIAL_OFFSET: 0.7, // アリーナ半径に対する比率
  COLOR_FIGHTER_A: 0x7bd389,
  COLOR_FIGHTER_B: 0xf97070,
  COLOR_ARENA: 0x4a90e2,
} as const;
```

---

### タスク 3: エラーハンドリング追加

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

## 🚀 次のステップ実行順序

1. **型安全性**: グローバル型定義 → `@ts-expect-error` 削除
2. **テスト**: Vitest セットアップ → 最初のテスト → スナップショット
3. **品質**: ESLint/Prettier → マジックナンバー定数化 → エラーハンドリング
4. **確認**: `npm run lint && npm test && npm run build`

すべて完了したら、**フェーズ 2: シミュレーション拡張** へ進みましょう！
