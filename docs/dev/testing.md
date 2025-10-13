# テストガイド

決定論を維持するため、ロジック変更時は必ずテストを最新化し、ログ差分を確認します。

## テスト環境

- フレームワーク: Vitest（`happy-dom` ランタイム）
- カバレッジ: `@vitest/coverage-v8`
- 主な対象: `src/sim/**/__tests__`, `src/ui/**/__tests__`, `src/render/**/__tests__`

## 基本コマンド

```bash
npm run test          # 全テストを 1 回実行
npm run test:ui       # Vitest UI（絞り込み / 再実行向け）
npm run test:coverage # HTML & lcov カバレッジ生成
```

- 個別実行: `npx vitest run src/sim/__tests__/battle.test.ts`
- ウォッチモード: `npx vitest --watch`

## カバレッジ基準

- シミュレーション層（`src/sim/`）: ステート遷移を網羅し **ステートメント 95%以上** を維持。
- UI/描画層: 主要フローとバインドをユニットテストし、不足分は手動確認 (`npm run preview`) で補う。
- HTML レポートは `coverage/index.html` に出力するが、リポジトリにはコミットしない。

## メンテナンスポイント

- 判定ロジックやプリセットを変更したら、`BattleLog` の整合性テストを追加し、決定論が崩れていないか確認する。
- 描画や UI を更新した際は `debugPanel.test.ts` などのスナップショットを再生成せず、明示的なアサーションに置き換える。
- `window.$orbi` API を増やした場合はモックを更新し、UI からの呼び出しが安全に失敗することもテストする。
