# テストガイド

Simulation 層の決定論を担保するため、ロジック変更時は必ずテストとログ差分を更新します。

## テスト環境

- フレームワーク: Vitest（`happy-dom` ランタイム）
- カバレッジ: `@vitest/coverage-v8`
- 主な対象: `src/sim/**/__tests__`, `src/render/**/__tests__`, `src/ui/**/__tests__`

## 基本コマンド

```bash
npm run test          # 全テストを一括実行
npm run test:ui       # Vitest UI。ウォッチとフィルタリング向け
npm run test:coverage # HTML / lcov カバレッジを生成
```

- 個別ファイル: `npx vitest run src/sim/__tests__/battle.test.ts`
- ウォッチ: `npx vitest --watch`

## カバレッジ基準

- Simulation 層 (`src/sim/`): ステートメント 95% 以上を維持。判定ロジック変更時は異常系テストを追加。
- Rendering / UI 層: 主要バインディングをユニットテストし、不足分は `npm run preview` で手動確認。
- レポート出力先は `coverage/index.html`。成果物はコミット対象外。

## メンテナンスポイント

- プリセットや勝敗判定を更新した場合は `BattleLog` の決定論テストを更新し、差分比較で再現性を確認。
- UI スナップショットは最小限にし、動作保証は明示的なアサーションへ移行する。
- `window.$orbi` の API を拡張したらモックと UI テストを更新し、エラーハンドリングを検証する。
