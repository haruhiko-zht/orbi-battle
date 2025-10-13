# 描画仕様 (Phaser)

## 要素一覧

| 要素         | 種類                     | 内容                                                                 |
| ------------ | ------------------------ | -------------------------------------------------------------------- |
| Arena        | `Phaser.GameObjects.Arc` | `arenaRadius` から決まる円形フィールド。                             |
| Fighters     | `Arc`                    | チームカラーを自動割り当て。半径 6px を既定。                        |
| HP Bars      | `Graphics`               | 背景 + 残量バー。味方/敵でカラーパレットを分ける。                   |
| HP Labels    | `Text`                   | HP バー中央に重ねて現在値を表示。                                    |
| Attack Range | `Graphics`               | ファイター毎の射程サークル。生存中のみ表示し、透明度で視認性を調整。 |
| Result Text  | `Text`                   | `WINNER: <teamId>` を表示。ログ末尾で確定。                          |

## シーン構造

- `BattleScene` — Phaser のエントリーポイント。`BattleRuntimeController` から状態を受け取り `renderState` を呼ぶ。
- `BattleRuntimeController` — ログ再生と `window.$orbi` API の実装。描画レイヤー外からインスタンス生成。
- `battleLayers.ts` — Fighter / HP / 攻撃射程などのレイヤー構築ヘルパー。シーンから再利用。
- `playbackController.ts` — 再生速度とフレームスキップ管理。描画が追いつかない場合に補正する。

## レイアウト

- アリーナ中心はキャンバス中央。描画領域は 720x720（`main.ts` 参照）を想定。
- HP バーは 2 列構成。
  - 味方（`teams[0]`）: 画面右下から上方向へスタック。
  - 敵（`teams[1]`）: 画面左下から上方向へスタック。
- 2 チームを超える編成を受け取った場合は警告を出して単列レイアウトにフォールバック。
- 攻撃射程サークルはファイターの中心に配置し、現在値 (`range`) を半径に使用。リセット時に再生成する。
- HP テキストは Phaser の `setOrigin(0.5)` で中央配置。

## デバッグメモ

- `window.$orbi.game` からシーンインスタンスを取得し、`scene.children.list` を確認すると描画オブジェクトを即時調査できる。
- 攻撃射程が重なりすぎる場合は `range` の変更だけでなく `arenaRadius` と初期位置を合わせて調整する。
- 描画のパフォーマンス問題が発生した場合、`BattleRuntimeController` の `shouldSkipFrame` ログを確認し、ログの事前計算時間 (`simulateBattle`) にボトルネックがないか切り分ける。
