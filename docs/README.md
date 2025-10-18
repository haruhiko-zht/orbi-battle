# ドキュメントガイド

orbi-battle のドキュメントは「開発」「設計」「運用」の 3 軸で整理しています。README から 2 クリック以内に目的の情報へ到達できる構成を維持してください。

## まず読む

- [dev/setup.md](./dev/setup.md) — 必要なツールと初回セットアップ、デバッグパネルの使い方。
- [dev/testing.md](./dev/testing.md) — テスト実行パターン、カバレッジ基準、決定論チェックの指針。

## 設計リファレンス

- [design/architecture.md](./design/architecture.md) — レイヤー構造、データフロー、`window.$orbi` API。
- [design/simulation.md](./design/simulation.md) — シミュレーションの状態遷移、戦術レジストリ、バリデーション。
- [design/rendering.md](./design/rendering.md) — Phaser シーン構成、HUD／描画責務、パフォーマンス留意点。
- [design/parameters.md](./design/parameters.md) — プリセット定義とバランス調整の目安。

## 開発リファレンス

- [dev/tactics-system.md](./dev/tactics-system.md) — 戦術追加手順とレジストリ更新のフロー。
- [dev/roadmap.md](./dev/roadmap.md) — 直近スプリントの優先タスクと次候補。

## 運用・履歴

- [changelog.md](./changelog.md) — 更新履歴とテスト証跡。

## ドキュメント運用ポリシー

- 実装変更と同じブランチで関連ドキュメントを更新する。
- 古い情報は追記ではなく統合または削除し、詳細議論は Issue / PR に移す。
- ドキュメントのリンク切れと重複を定期的に見直す。
