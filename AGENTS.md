# AGENTS ガイド

## プロジェクト概要

- **orbi-battle** は TypeScript・Phaser・React・Vitest で構築された 2D 円形アリーナのオートバトルシミュレーターです。
- バトルのシミュレーションはクライアント描画とは独立した決定的（deterministic）な事前演算で行われ、結果をリプレイとして再生します。
- リポジトリ内のドキュメント補助: 詳細な設計メモは `docs/` 配下、リリースメモは `docs/changelog.md` を参照してください。

## ゲーム仕様の前提

- バトルは常に 2 チーム構成（`teams[0]` = 味方、`teams[1]` = 敵）を前提としています。多人数戦や PvE 波状戦は仕様外なので、汎用化を試みないでください。
- HP HUD や勝敗表示、`resolveBattleTeams()` などのユーティリティは上記前提をもとに最適化されています。チーム数制約に関する指摘は不要です。

## ディレクトリ構成の要点

- `src/main.ts`: Phaser の初期化、デバッグパネルのマウント、`window.$orbi` API の公開。
- `src/config/`: アリーナのプリセットやバリデーション用定数を管理 (`defaults.ts` 等)。
- `src/render/`: Phaser シーンと描画制御 (`phaserScene.ts`, `battleLayers.ts`, `battleRuntimeController.ts`)。`__tests__/` に描画層向けのユニットテストが同居します。
- `src/sim/`: 決定的なバトルエンジン本体。`ai/`, `systems/`, `placement/`, `validation.ts` などサブモジュールごとに整理され、レンダリング・DOM 依存は禁止です。
- `src/ui/`: React 製デバッグパネル (`debugPanel.tsx`) と `window.$orbi` ブリッジ (`api/orbiBridge.ts`)。
- `src/types/`: レイヤー横断で共有する型 (`playback.ts`, `global.d.ts`)。
- `dist/`: `npm run build` の出力。`coverage/`: `npm run test:coverage` の結果（Git 管理対象外）。

## よく使う npm スクリプト

- `npm install`: 依存関係のインストール（ロックファイル更新後にも実行）。
- `npm run dev`: Vite 開発サーバー（`http://localhost:5173/`）。
- `npm run build`: 本番ビルド。TypeScript 型チェックを含み、出力は `dist/`。
- `npm run preview`: 本番ビルドのローカル確認。
- `npm run test`: Vitest（`happy-dom` 環境）。
- `npm run test:ui`: Vitest UI。
- `npm run test:coverage`: V8 カバレッジレポート（HTML・`lcov`）。
- `npm run format` / `npm run format:check`: Prettier フォーマット。

## コーディング規約

- TypeScript + ES Modules。インデント 2 スペース、末尾セミコロン有り、ダブルクォート統一。
- クラス・シーン名は `PascalCase`、関数・変数・ファイルは `camelCase`。
- テストは実装と同じ階層に `__tests__` ディレクトリを置き、`*.test.ts` として配置。
- UI レイヤーは React + JSX。ロジックは hooks に小分けし、副作用は `useEffect`、状態変換は `useMemo` / `useCallback` でメモ化します。
- 複雑な計算・タイミング調整は短いコメントで意図を明記してください（日本語優先、必要に応じて英語併記）。

## 拡張の指針

- シミュレーション層のファイター処理は `createDefaultFighterSystems()` を基にしたシステムパイプラインで構築されています。`EngineOptions.createFighterSystems` からカスタムシステムを注入することで、職業・装備による攻撃バリエーションなどを柔軟に追加できます。
- ファイター固有の挙動差分は `FighterParams` / `FighterState` に属性を拡張し、`FighterSystemContext.self.params` を参照する形で実装してください。

## テストと品質保証

- シミュレーション層は純粋関数を優先し、`vitest` で単体テストを網羅します。RNG 周りを変更した場合は `npm run test:coverage` を実行して差分を確認してください。
- 描画層は Phaser 依存があるため、型チェックと最小限のユニットテスト＋ `npm run preview` での目視確認を組み合わせます。
- 新しい AI (`src/sim/ai/`) やシステム (`src/sim/systems/`) を追加する際は、決定性（determinism）が維持されることをテストで保証します。

## コミット / PR 運用

- コミットメッセージは短く現在形。必要なら本文で背景・挙動変更・テスト結果を補足します（日本語メッセージ歓迎）。
- PR には課題、解決方法、実施テスト、関連 Issue を明記し、UI 変更時はスクリーンショットやショート動画を添付します。
- マージ前に `main` へリベースし、CI が通過していることを確認します。

## デバッグと設定のヒント

- デフォルトチーム構成は `src/config/defaults.ts` を編集してください。生成物やログ (`dist/`, `coverage/`) を直接修正しないでください。
- デバッグパネルは `window.$orbi.reset(config)` に依存します。新しい操作を追加したら `npm run dev` でブラウザを開き動作を検証してください。
- グローバル名前空間の公開は `$orbi` に限定し、その他のグローバル汚染を避けます。

## コミュニケーション指針

- ユーザーへの応答は日本語で行い、簡潔・丁寧・具体的にまとめます。
- 技術用語は可能な限り一般的な日本語訳を用い、必要に応じて英語原語も併記します。
- コマンドやパスはバッククォートで囲み、再現手順は短く提示します。
