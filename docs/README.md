# Orbi Battle - 概要

## コアコンセプト

- 上から見下ろしの**円形 2D オートバトル**。
- プレイヤーは事前に装備・戦術をセットし、戦闘開始後は自動で戦う。
- 戦闘は**シミュレーション結果を描画**する構造。

## 技術スタック

| 分野   | 使用技術                    |
| ------ | --------------------------- |
| 言語   | TypeScript                  |
| 描画   | Phaser 3                    |
| ビルド | Vite                        |
| 乱数   | Mulberry32 (seed 固定)      |
| 構造   | Simulation / Rendering 分離 |

## 現状

### 実装済み機能

- 1vs1 バトル実装済み
- HP バー中央に実数表示
- パラメータを Debug パネルで即時変更可能
- **リプレイシステム**: 事前シミュレーション + ログ記録
- **決定論的動作**: 同じシード・設定で同じ結果
- 固定タイムステップシミュレーション (60Hz)

### ドキュメント

- 詳細な JSDoc コメント（全ファイル）
- 設計ドキュメント充実
  - [architecture.md](./design/architecture.md) - アーキテクチャ全体像
  - [system.md](./design/system.md) - システム設計
  - [simulation.md](./design/simulation.md) - シミュレーション仕様
  - [parameters.md](./design/parameters.md) - パラメータ仕様
  - [rendering.md](./design/rendering.md) - 描画仕様
- 開発ドキュメント
  - [roadmap.md](./dev/roadmap.md) - 今後の開発計画（フェーズ別）
  - **[next-steps.md](./dev/next-steps.md)** - 次のステップ詳細ガイド
  - [setup.md](./dev/setup.md) - セットアップ手順
  - [test.md](./dev/test.md) - テスト方針
