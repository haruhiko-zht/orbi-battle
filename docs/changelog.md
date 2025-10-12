# 更新履歴

## 2025-10-12

### フェーズ 0.1: 型安全性の向上 ✅

**グローバル型定義の追加**

- `src/types/global.d.ts` を新規作成
  - `window.$orbi` API の型定義を追加
  - `game`, `reset()`, `getLog()` の型を定義
- 3 箇所の `@ts-expect-error` を削除
  - `src/main.ts`: 型アサーションに変更
  - `src/render/phaserScene.ts`: 型安全なスプレッド構文に変更
  - `src/ui/debugPanel.ts`: 型定義により不要に
- TypeScript コンパイルエラーゼロを確認

**効果**

- エディタで `window.$orbi` の補完が効くようになった
- 型エラーを事前に検知できるようになった
- コードの保守性が向上

### フェーズ 0.3: Prettier セットアップ ✅

**インストールと設定**

- Prettier を devDependency として追加
- `.prettierrc` 設定ファイルを作成
  - セミコロンあり
  - ダブルクォート
  - タブ幅 2
  - ES5 の trailing comma
  - 行幅 80 文字
- `.prettierignore` を作成
  - `node_modules`, `dist`, `coverage` などを除外
- `package.json` にスクリプト追加
  - `npm run format`: 全ファイルをフォーマット
  - `npm run format:check`: フォーマット違反をチェック

**実行結果**

- コードベース全体を自動フォーマット
- 5 ファイルを整形（マークダウン、HTML）
- ソースコードは既に規約に準拠していた

**ドキュメント更新**

- `docs/dev/roadmap.md` を更新
  - フェーズ 0.1, 0.3 の完了状態を反映
  - 優先度マトリクスを更新
- `docs/dev/next-steps.md` を全面刷新（※現在はロードマップへ統合済み）

### シミュレーション入力バリデーション ✅

**実装**

- `src/sim/validation.ts` を新規追加し、`BattleConfig` のランタイム検証を共通化
- `simulateBattle()` と `Engine` コンストラクタの入口で検証を実行し、`tickRate`・`arenaRadius`・ファイターパラメータ・AI タイプの異常値を即時検出
- `simulateBattle` の `maxSeconds` オプションも同一ロジックでチェック

**テスト**

- `src/sim/__tests__/battle.test.ts` と `src/sim/__tests__/engine.test.ts` に異常値テストを追加
- `npx vitest run src/sim/__tests__/battle.test.ts src/sim/__tests__/engine.test.ts --pool=threads` で全テストが成功することを確認

---

## 2025-10-11

### 初期実装

- 垂直スライス雛形構築 (Phaser + TS)
- HP バー中央実数表示追加
- Debug パネルで即時リセット実装

### リプレイシステム実装

- 事前シミュレーション方式の導入
- `BattleLog` 型の追加（全フレーム記録）
- `simulateBattle()` 関数の実装
- `BattleSim` をリプレイヤーに変更
- `window.$orbi.getLog()` でログ取得可能に

### ドキュメント・コメント整備

- 全ソースファイルに JSDoc コメント追加
- 型定義にドキュメント追加
- システム設計ドキュメント更新
- シミュレーション仕様ドキュメント更新

### テスト環境整備 ✅

**セットアップ**

- Vitest + @vitest/ui のインストールと設定
- @vitest/coverage-v8 でカバレッジ測定環境を構築
- happy-dom を導入して DOM 環境テストに対応
- vite.config.ts にテスト設定を追加
- package.json にテストスクリプト追加（test, test:ui, test:coverage）

**シミュレーション層のテスト** (53 テスト)

- `src/sim/__tests__/engine.test.ts` - 8 テスト
  - Engine の初期状態、決定論的動作、境界条件を検証
- `src/sim/__tests__/battle.test.ts` - 21 テスト
  - simulateBattle() の動作検証（10 テスト）
  - BattleSim クラスの全メソッドを検証（11 テスト）
- `src/sim/__tests__/rng.test.ts` - 10 テスト
  - Mulberry32 乱数生成器の決定論的動作を検証
- `src/sim/__tests__/log.test.ts` - 9 テスト
  - cloneState(), cloneConfig() の深いコピーを検証
- `src/sim/__tests__/fighter.test.ts` - 16 テスト
  - 型定義の整合性と動作検証

**UI レイヤーのテスト** (15 テスト)

- `src/ui/__tests__/debugPanel.test.ts` - 11 テスト
  - DOM 操作、入力フィールド、Restart ボタンの動作を検証
  - window.$orbi API の呼び出しをモックで検証
- `src/render/__tests__/phaserScene.test.ts` - 4 テスト
  - 型定義の整合性確認
  - アーキテクチャノート（描画層は E2E テストで検証）

**カバレッジ結果**

- 全体: 64.9% statements | 89.28% branches | 92% functions
- sim 層: 96.17% - コアロジックがほぼ完全にカバー
  - battle.ts: 95.52%
  - engine.ts: 96.15%
  - log.ts: 100%
  - rng.ts: 100%
- ui 層: 100% - debugPanel.ts が完全にカバー
- テストケース総数: **79 個**、すべてパス

**ドキュメント**

- `docs/dev/testing.md` を新規作成
  - テスト環境のセットアップ方法
  - テストファイル構成の説明
  - カバレッジレポートの解説
  - テストの書き方とベストプラクティス
