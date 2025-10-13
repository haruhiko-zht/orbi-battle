# 更新履歴

## 2025-10-12

- **描画** — 攻撃射程サークルを追加し、ファイター半径を 6px に調整。全プリセット（1v1 / 3v3 / AI デモ / Mixed）で射程を 9〜10px に再設定。
- **型安全性** — `src/types/global.d.ts` を追加して `window.$orbi` API を型定義。既存の `@ts-expect-error` を除去し、TypeScript エラーゼロを確認。
- **フォーマット** — Prettier を導入 (`npm run format`, `format:check`)。初回整形を実施し、マークダウン/HTML ファイルを統一。
- **入力検証** — `src/sim/validation.ts` を共通化し、`simulateBattle` / `Engine` が `tickRate`・`arenaRadius`・`aiType` を検証。異常値テストを追加。
- **テスト** — `npm run test` を完走。`battle.test.ts` / `engine.test.ts` にバリデーションの異常系を追加。

## 2025-10-11

- **初期実装** — Phaser + TypeScript の垂直スライスを構築し、デバッグパネルから `window.$orbi.reset` を提供。
- **リプレイシステム** — 事前シミュレーション方式を導入し、`BattleLog` / `simulateBattle` / `BattleSim` を実装。
- **テスト環境** — Vitest + happy-dom + coverage を整備。シミュレーション 53 件・UI/描画 15 件のテストを作成し、総カバレッジ 64.9%（sim 層 96.17%）。
