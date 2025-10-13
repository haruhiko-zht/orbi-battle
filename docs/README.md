# ドキュメントガイド

最新の実装と運用方針を前提に、必要な情報へ最短で辿れるよう再編成しています。

## 開発フロー

- [dev/setup.md](./dev/setup.md) — 必要なツール、初回セットアップ、デバッグ起動
- [dev/testing.md](./dev/testing.md) — Vitest 実行パターンとカバレッジ基準
- [dev/ai-system.md](./dev/ai-system.md) — AI 拡張ポイントと追加手順
- [dev/roadmap.md](./dev/roadmap.md) — 直近 2〜4 週間の優先タスク

## 設計リファレンス

- [design/architecture.md](./design/architecture.md) — レイヤー構造、データフロー、`window.$orbi` API 概要
- [design/simulation.md](./design/simulation.md) — シミュレーションルール、AI レジストリ、検証フック
- [design/rendering.md](./design/rendering.md) — Phaser シーン構造、攻撃射程表示、レイアウト制約
- [design/parameters.md](./design/parameters.md) — プリセット値、バランス調整の目安

## 履歴・変更管理

- [changelog.md](./changelog.md) — リリースノートとテスト証跡

## ドキュメント運用

- README とこのガイドから目的の情報へ 2 クリック以内で到達できる状態を維持する
- 古いトピックは追記より統合・削除を優先し、 Issue / PR に最新議論を追い出す
- 実装が更新された場合は関連する設計・手順ドキュメントを同じブランチで更新する
