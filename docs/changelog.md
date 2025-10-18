# 更新履歴

## 2025-10-18

- **ドキュメント** — README.md と `docs/` 配下を再編成。最新のレイヤー構造・戦術 UI 状態を反映し、冗長な記述を整理。
- **ロードマップ** — 基準日を更新し、完了済みタスク（戦術選択 UI）を「最近完了」へ移動。

## 2025-10-12

- **描画** — 攻撃射程サークルを追加し、ファイター半径を 6px に調整。全プリセット（1v1 / 3v3 / 戦術デモ / Mixed）で射程を 9〜10px に再設定。
- **型安全性** — `src/types/global.d.ts` を追加して `window.$orbi` API を型定義。既存の `@ts-expect-error` を除去し、TypeScript エラーゼロを確認。
- **フォーマット** — Prettier を導入 (`npm run format`, `format:check`)。初回整形を実施し、マークダウン/HTML ファイルを統一。
- **入力検証** — `src/sim/validation.ts` を共通化し、`simulateBattle` / `Engine` が `tickRate`・`arenaRadius`・`tacticId` を検証。異常値テストを追加。
- **テスト** — `npm run test` を完走。`battle.test.ts` / `engine.test.ts` にバリデーションの異常系を追加。

## 2025-10-11

- **初期実装** — Phaser + TypeScript の垂直スライスを構築し、デバッグパネルから `window.$orbi.reset` を提供。
- **リプレイシステム** — 事前シミュレーション方式を導入し、`BattleLog` / `simulateBattle` / `BattleSim` を実装。
- **テスト環境** — Vitest + happy-dom + coverage を整備。シミュレーション 53 件・UI/描画 15 件のテストを作成し、総カバレッジ 64.9%（sim 層 96.17%）。
