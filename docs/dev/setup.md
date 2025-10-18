# 開発環境セットアップ

## 前提ツール

- Node.js 20 以上（推奨: LTS v20 系）
- npm v10 以上（Node.js に同梱）
- TypeScript 対応エディタ（VS Code 推奨）
- `git`

Phaser / React / Vite / Vitest は依存として自動取得されます。

## 初期セットアップ手順

```bash
npm install
npm run dev
```

1. 開発サーバーは `http://localhost:5173` で起動します。
2. 初期表示は 1v1 プリセット（`src/config/defaults.ts`）。保存すると Vite の HMR で即時反映されます。
3. 停止はターミナルで `Ctrl + C`。

## デバッグパネル活用

- 右側のパネルでパラメータを編集し `Restart` を押すと決定論を保ったまま再シミュレート。
- `window.$orbi` から `reset` / `seekFrame` / `setPlaybackRate` などの API を直接呼び出せます。
- プリセット切り替えはドロップダウンから可能。カスタム構成は自動で `custom` として扱われます。

## よく使う追加コマンド

- `npm run preview` — 本番ビルド (`npm run build`) 後の成果物をローカル配信。
- `npm run build` — 型チェック付き最適化ビルド。CI と同一フロー。
- `npm run test` — 変更検証の基本。ウォッチモードは `npx vitest --watch`。

## トラブルシューティング

- ポート競合時は `npm run dev -- --port=5174` のように指定してください。
- `vite` がキャッシュを保持して不整合が起きた場合は `rm -rf node_modules/.vite` 後に再起動します。
