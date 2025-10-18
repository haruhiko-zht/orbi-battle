# AGENTS ガイド

## プロジェクト概要

- **orbi-battle** は TypeScript / Phaser / React / Vitest で構築した 2D 円形アリーナのオートバトルシミュレーターです。
- シミュレーションは描画と独立した事前計算で実行され、生成した `BattleLog` を再生してリプレイを提供します。
- 詳細設計は `docs/`、更新履歴は `docs/changelog.md` を参照してください（最終更新: 2025-10-18）。

## すぐに使うコマンド

```bash
npm install
npm run dev      # http://localhost:5173 で再生
npm run test     # Vitest (happy-dom)
npm run build    # 型チェック付き本番ビルド
npm run preview  # build 済み成果物のローカル確認
```

追加で `npm run test:coverage`（カバレッジ確認）、`npm run format` / `format:check`（Prettier）を利用します。

## レイヤーと主要ファイル

- `src/sim/` — 決定論的バトルエンジン。`simulateBattle` / `BattleSim` / `validation.ts` を中心に、AI (`ai/`)、システム (`systems/`)、初期配置 (`placement/`) を分離。
- `src/render/` — Phaser シーン (`phaserScene.ts`) と `BattleRuntimeController` が `BattleLog` を再生し、HUD や射程表示を描画。
- `src/ui/` — React デバッグパネル (`debugPanel.tsx`) と `api/orbiBridge.ts` が `window.$orbi` を介して操作。
- `src/config/defaults.ts` — 1v1 / 3v3 / AI デモ / Mixed プリセット。チームは常に 2 列（味方 `teams[0]`, 敵 `teams[1]`）。
- `src/types/` — 共有型と `global.d.ts`。`window.$orbi` API の型を提供。

## 作業ルール

- 2 チーム構成が仕様。多人数戦の汎用化は不要。HUD もこの前提で最適化済み。
- TypeScript + ES Modules。インデント 2 スペース、末尾セミコロン、ダブルクォート統一。
- テストは実装と同階層の `__tests__` に配置。必要な場合のみスナップショットを使用し、決定論テストを優先。
- UI ロジックは hooks へ分割し、副作用は `useEffect`、計算は `useMemo` / `useCallback` でメモ化。
- シミュレーション層では DOM / Phaser への依存、`Math.random()` / `Date.now()` の使用を禁止。`src/sim/rng.ts` を利用。

## テストと品質保証

- ロジック変更時は `npm run test` を実行し、差分が疑わしい場合は `npm run test:coverage` で範囲を確認。
- 描画変更は最小限のユニットテストに加え `npm run preview` で視覚確認。必要に応じてスクリーンショットを PR に添付。
- 新しい AI やシステムを追加したら決定論テスト（`src/sim/__tests__`）を更新し、ログ差分が再現することを保証します。

## 拡張・実装のヒント

- `EngineOptions.createFighterSystems` を差し替えると職業・装備などの拡張が可能。`FighterParams` / `FighterState` に属性を追加して扱います。
- 設定項目を増やす場合は `src/config/defaults.ts` と `src/sim/validation.ts`、UI フォーム（`debugPanel.tsx`）を同じブランチで更新。
- `window.$orbi` には `reset` / `play` / `pause` / `seekFrame` / `setPlaybackRate` / `getPlaybackInfo` / `getLog` が公開済み。追加 API は型定義とドキュメントを同時更新。

## コミットとレビュー

- コミットメッセージは短く現在形。テスト結果や背景は本文で補足。
- PR では課題・解決策・実施テスト・関連 Issue を明記し、UI 変更はキャプチャを添付。
- マージ前に最新 `main` へリベースし、CI を通過させてください。

## コミュニケーション指針

- 応答は日本語で簡潔・丁寧・具体的にまとめる。
- 技術用語は一般的な日本語訳を用い、必要に応じて英語表記を併記。
- コマンド・パスはバッククォートで示し、再現手順は短く提示する。
