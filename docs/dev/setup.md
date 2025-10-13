# 開発環境セットアップ

## 前提ツール

- Node.js 20 以上（推奨: LTS v20 系）
- npm（付属の v10 以上）
- VS Code など TypeScript 対応エディタ
- `git`（リポジトリアクセスとフック管理用）

Phaser / React / Vite / Vitest はリポジトリに含まれるため別途インストールは不要です。

## 初期セットアップ

```bash
npm install        # 依存関係を取得
npm run dev        # http://localhost:5173 で開発サーバー起動
```

- 初回起動時は 1v1 のプリセット (`src/config/defaults.ts`) が読み込まれる。
- ブラウザを開いた状態で保存すると、Vite のホットリロードでミリ秒単位の反映を確認できる。

## デバッグパネル

- 右側のデバッグパネルからパラメータを変更し、`Restart` で再シミュレーション。
- ブラウザコンソールで `window.$orbi` を参照すると、`reset` / `stepFrame` / `getPlaybackInfo` などの API を直接実行できる。
- 3v3 や AI デモを試す際は `src/config/defaults.ts` のプリセットをコンソールから渡すか、デバッグパネルでパラメータを調整する。

## 追加コマンド

- `npm run preview` — `npm run build` 後の `dist/` を本番設定で配信。
- `npm run build` — 型チェック付きの最適化ビルド。CI と同じ流れ。
- `npm run test` — 実装変更時はコミット前に実行。
