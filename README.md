# orbi-battle

2D 円形アリーナでの決定論的オートバトルシミュレーター。

## クイックスタート

1. `npm install`
2. `npm run dev`
3. ブラウザで `http://localhost:5173`

## 主な特徴

- **事前シミュレーション**で全フレームを計算し、リプレイや検証が容易
- **決定論的ロジック**により同じシードと設定で常に同結果を保証
- **レイヤー分離**（Simulation / Rendering / UI）でテストしやすく拡張が容易
- **デバッグパネル**からリアルタイムにパラメータ変更とリセットが可能

## アーキテクチャ概要

- `src/sim/`: 乱数を含むすべての戦闘ロジック。Node.js 環境でも実行可能。
- `src/render/`: Phaser シーン。ログを再生して描画のみ担当。
- `src/ui/`: Debug パネルなど DOM 連携を管理。
- `src/config/defaults.ts`: アリーナプリセットとパラメータの集約。

詳細は [docs/README.md](./docs/README.md) と設計ドキュメントを参照してください。

## 開発コマンド

- `npm run dev` — Vite のホットリロード開発サーバー
- `npm run build` — 本番ビルド（TypeScript 型チェックあり）
- `npm run preview` — `dist/` ビルドのローカル確認
- `npm run test` — Vitest（happy-dom）でユニットテスト
- `npm run test:coverage` — HTML & lcov カバレッジレポート生成
- `npm run test:ui` — インタラクティブな Vitest UI

## ドキュメント一覧

| 種別 | ドキュメント                                     | 内容                                 |
| ---- | ------------------------------------------------ | ------------------------------------ |
| 概要 | [docs/README.md](./docs/README.md)               | ドキュメント全体の案内と索引         |
| 設計 | [architecture.md](./docs/design/architecture.md) | レイヤー構造・データフロー・更新周期 |
| 設計 | [simulation.md](./docs/design/simulation.md)     | シミュレーションルールと決定論の要点 |
| 設計 | [rendering.md](./docs/design/rendering.md)       | 描画要素とレイアウト指針             |
| 設計 | [parameters.md](./docs/design/parameters.md)     | バランス調整用パラメータの基準       |
| 開発 | [setup.md](./docs/dev/setup.md)                  | 環境要件と初期セットアップ           |
| 開発 | [testing.md](./docs/dev/testing.md)              | テスト実行とカバレッジ確認           |
| 開発 | [roadmap.md](./docs/dev/roadmap.md)              | 直近の改善テーマ                     |
| 履歴 | [changelog.md](./docs/changelog.md)              | 更新履歴と変更理由                   |

不要になった情報は順次削除し、重要なドキュメントに集約しています。
