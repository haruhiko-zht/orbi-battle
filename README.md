# orbi-battle

2D 円形アリーナでのオートバトルシミュレーター

## セットアップ

```sh
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

## 特徴

- **事前シミュレーション方式**: バトル全体を計算してリプレイ可能
- **決定論的**: 同じシード・設定で同じ結果を保証
- **レイヤー分離**: シミュレーション/描画/UI を完全分離
- **デバッグパネル**: パラメータをリアルタイムで調整可能

## ドキュメント

### 📚 設計ドキュメント

- [アーキテクチャ全体像](./docs/design/architecture.md) - レイヤー構造、データフロー
- [システム設計](./docs/design/system.md) - 各層の役割と連携
- [シミュレーション仕様](./docs/design/simulation.md) - AI ロジック、決定論

### 🚀 開発ガイド

- [開発ロードマップ](./docs/dev/roadmap.md) - フェーズ別の実装計画
- **[次のステップガイド](./docs/dev/next-steps.md)** - 今すぐ始められるタスク
- [セットアップ手順](./docs/dev/setup.md)
- [更新履歴](./docs/changelog.md)

### 📖 その他

全体概要は [docs/README.md](./docs/README.md) を参照
