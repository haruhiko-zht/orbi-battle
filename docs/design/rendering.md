# 描画仕様 (Phaser)

## 概要

Phaser シーンは事前計算済みの `BattleLog` を再生する専任レイヤーです。ログから `BattleState` を受け取り、アリーナ、ファイター、HUD を描画します。

## 主な描画要素

- **Arena** (`Phaser.GameObjects.Arc`) — `arenaRadius` を半径とするフィールド。中央に配置。
- **Fighter** (`Arc`) — チームカラー付き。半径 6px。生死に応じて可視状態を切り替え。
- **HP HUD** (`Graphics` + `Text`) — 2 列構成。残量バーと数値ラベルを重ねて表示。
- **Attack Range** (`Graphics`) — 生存中のみ射程サークルを描画。透明度で視認性を確保。
- **Result Text** (`Text`) — `WINNER: <teamId>` をログ末尾で表示し、勝敗を明示。

## シーン構成

- `BattleScene` — Phaser エントリーポイント。更新ループで `renderState` を呼び出す。
- `BattleRuntimeController` — 再生・シーク・速度調整を行い `BattleScene` に現在フレームを渡す。
- `battleLayers.ts` — Arena / Fighters / HUD の構築ヘルパー。Scene 初期化時に組み立てる。
- `playbackController.ts` — 速度変更とフレームスキップを管理し、描画追従性を保つ。

## レイアウトと HUD

- キャンバスは `main.ts` で 720x720 前提。中心を原点とする配置。
- HP バーは味方 (`teams[0]`) を右列、敵 (`teams[1]`) を左列に縦積み。チームが 2 を超えた場合は警告を出し単列へフォールバック。
- 射程サークルは `range` を半径とし、リセット時に再生成。透明度を抑え重なりを視認しやすくする。
- HP ラベルは `setOrigin(0.5)` で中央揃えし、数値変化を即座に反映。

## パフォーマンスとデバッグ

- `BattleRuntimeController.shouldSkipFrame` で描画遅延を検知し、必要に応じてフレーム間引きを適用。
- `window.$orbi.game.scene.keys.Battle` からシーンにアクセスし、`children.list` を確認するとオブジェクト構成を即時に調査可能。
- 射程の視認性が低い場合は `arenaRadius`・初期位置・`range` を同時に調整して衝突を緩和する。
