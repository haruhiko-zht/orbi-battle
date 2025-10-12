# テストガイド

シミュレーション層を中心に高い決定論を維持するため、テストは常に最新状態を確認してください。

## テスト環境

- フレームワーク: Vitest（`happy-dom` ランタイム）
- カバレッジ: `@vitest/coverage-v8`
- 実行対象: `src/sim/**/__tests__`, `src/ui/**/__tests__`, `src/render/**/__tests__`

## よく使うコマンド

```bash
npm run test          # 全テスト
npm run test:ui       # UI モード（フォーカス実行）
npm run test:coverage # HTML & lcov カバレッジ
```

- 個別実行: `npx vitest run src/sim/__tests__/battle.test.ts`
- ウォッチ: `npx vitest --watch`

## カバレッジと目安

- シミュレーション層（`src/sim/`）は 95% 以上を維持
- UI/描画層は主要フローを単体テスト + 手動確認で補完
- カバレッジ HTML は `coverage/index.html` に出力（リポジトリへコミットしない）

## メンテナンス指針

- 判定ロジックやパラメータを変更した場合は、戦闘ログの整合性テストを追加
- 描画変更時は `debugPanel.test.ts` を更新し、UI の実体と乖離させない
- 大きな仕様変更は Vitest スナップショットではなく明示的なアサーションへ置き換える
