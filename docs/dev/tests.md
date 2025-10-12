# テスト環境ガイド

このドキュメントでは、orbi-battle プロジェクトのテスト環境について説明します。

## 概要

- **テストフレームワーク**: Vitest
- **カバレッジツール**: @vitest/coverage-v8
- **DOM 環境**: happy-dom
- **テストファイル数**: 7
- **テストケース数**: 79
- **全体カバレッジ**: 64.9% statements | 89.28% branches | 92% functions

## セットアップ

### 依存パッケージ

```json
{
  "devDependencies": {
    "vitest": "^3.2.4",
    "@vitest/ui": "^3.2.4",
    "@vitest/coverage-v8": "^3.2.4",
    "happy-dom": "^15.11.7"
  }
}
```

### スクリプト

```bash
# テストを実行
npm test

# UIモードでテストを実行
npm run test:ui

# カバレッジレポートを生成
npm run test:coverage
```

## テストファイル構成

### シミュレーション層 (src/sim/)

#### 1. engine.test.ts - 8 テスト

エンジンの動作検証:

- 初期状態の設定
- 決定論的動作（同じシードで同じ結果）
- ファイターがアリーナ外に出ない
- 死亡時の勝者判定
- 時刻の進行
- クールダウンの動作

#### 2. battle.test.ts - 21 テスト

バトルシミュレーション検証:

**simulateBattle()** (10 テスト)

- バトルログの生成
- 勝者判定
- 時刻の単調増加
- 決定論的動作
- スナップショットテスト

**BattleSim クラス** (11 テスト)

- fixedUpdate()の動作
- 時間蓄積の機能
- reset()の動作
- バトル終了後の挙動

#### 3. rng.test.ts - 10 テスト

乱数生成器の検証:

- 0.0〜1.0 の範囲
- 決定論的動作
- 異なるシードで異なる数列
- エッジケース（シード 0、負のシード）
- 分布の基本チェック
- 長いシーケンスでの決定論

#### 4. log.test.ts - 9 テスト

ログ機能の検証:

- cloneState()の深いコピー
- cloneConfig()の深いコピー
- コピー後の変更が元に影響しない

#### 5. fighter.test.ts - 16 テスト

型定義の整合性検証:

- FighterParams 型
- FighterState 型
- Vec2 型
- 動作検証（HP、クールダウン、パラメータの妥当性）

### UI 層 (src/ui/)

#### 6. debugPanel.test.ts - 11 テスト

デバッグパネルの検証:

- DOM 要素の生成
- 入力フィールドの生成と初期値
- Restart ボタンの動作
- window.$orbi API の呼び出し
- 複数回呼び出しの動作

### レンダリング層 (src/render/)

#### 7. phaserScene.test.ts - 4 テスト

型定義と構造の検証:

- BattleConfig の型定義
- アーキテクチャノート

**注意**: Phaser は Canvas API に依存するため、ユニットテストでの完全なテストは困難です。実際の描画ロジックは手動確認または E2E テストで検証します。

## カバレッジレポート

### 完全カバー (100%)

- **src/sim/log.ts** - ログ関連の関数
- **src/sim/rng.ts** - 乱数生成器
- **src/ui/debugPanel.ts** - デバッグパネル

### 高カバレッジ (95%以上)

- **src/sim/battle.ts** - 95.52%
  - BattleSim クラスのほぼすべての機能がテスト済み

- **src/sim/engine.ts** - 96.15%
  - バトルエンジンのコアロジックがテスト済み

### 未カバー領域

以下のファイルはユニットテストでカバーできない理由があります:

- **src/main.ts** - アプリケーションのエントリーポイント（E2E テストで検証）
- **src/render/phaserScene.ts** - Canvas API 依存（手動確認または E2E テスト）
- **src/config/defaults.ts** - 静的データ（テスト不要）
- **src/sim/types.ts** - 型定義のみ（TypeScript で検証済み）
- **src/sim/fighter.ts** - 現在は空ファイル

## テストの実行方法

### 全テストを実行

```bash
npm test
```

### 特定のファイルのテストを実行

```bash
npx vitest src/sim/__tests__/engine.test.ts
```

### ウォッチモードで実行

```bash
npx vitest --watch
```

### カバレッジレポートを生成

```bash
npm run test:coverage
```

カバレッジレポートは `coverage/index.html` に HTML で生成されます。

## テストの書き方

### 基本的なテスト

```typescript
import { describe, it, expect } from "vitest";
import { Engine } from "../engine";

describe("Engine", () => {
  it("初期状態が正しく設定される", () => {
    const config = {
      /* ... */
    };
    const engine = new Engine(config);

    expect(engine.state.t).toBe(0);
    expect(engine.state.winner).toBeNull();
  });
});
```

### DOM 操作のテスト

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createDebugPanel } from "../debugPanel";

describe("createDebugPanel", () => {
  beforeEach(() => {
    // DOM環境をクリア
    document.body.innerHTML = '<div id="overlay"></div>';
  });

  it("パネルを作成する", () => {
    createDebugPanel(config);
    const overlay = document.getElementById("overlay");
    expect(overlay).not.toBeNull();
  });
});
```

### モックの使用

```typescript
import { vi } from "vitest";

it("関数が呼ばれることを確認", () => {
  const mockFn = vi.fn();
  window.$orbi = { reset: mockFn };

  button.click();

  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

## ベストプラクティス

1. **各テストは独立させる**
   - beforeEach()で状態をリセット
   - テスト間で共有状態を持たない

2. **分かりやすいテスト名**
   - 日本語でテストの意図を明確に記述
   - 「〜が〜する」形式で書く

3. **AAA パターン**
   - Arrange（準備）: テストデータの準備
   - Act（実行）: テスト対象の実行
   - Assert（検証）: 結果の確認

4. **エッジケースもテストする**
   - 境界値（0, 負の数、最大値）
   - 空配列、null、undefined
   - エラーケース

## CI/CD 統合

将来的に、GitHub Actions でテストを自動実行する予定:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## トラブルシューティング

### happy-dom で Canvas API が使えない

Phaser などの Canvas 依存コードは、happy-dom ではテストできません。以下の対策を取ります:

1. Canvas 依存コードを分離
2. モックを使用
3. E2E テストで検証

### テストが遅い

- 不要なファイルをテストから除外
- 並列実行を有効化（Vitest はデフォルトで有効）
- 重いセットアップを beforeAll()に移動

## 参考資料

- [Vitest 公式ドキュメント](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [happy-dom](https://github.com/capricorn86/happy-dom)
