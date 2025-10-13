# シミュレーション仕様

## 構造

- **Fighter** — 味方/敵の行動主体。`FighterState` と `FighterParams` で属性を保持。
- **BattleState** — 1 フレーム分の位置・HP・勝敗を保持する不変オブジェクト。
- **Engine** — 固定タイムステップで状態を進め、勝敗・死亡判定を行う。
- **BattleSim** — `simulateBattle` が生成した `BattleLog` を再生するラッパー。`step` / `seek` / `getCurrentState` を提供。
- **BattleLog** — `config` + 全フレームの `BattleState` を保持。デバッグパネルから取得可能。
- **Validation** — `src/sim/validation.ts` が `BattleConfig` を検証し、異常値や未知の `aiType` を即時に弾く。

## チーム構成

- 現行仕様では常に 2 チーム（味方 `teams[0]`、敵 `teams[1]`）を前提とする。
- 追加陣営は未サポート。受け取った場合は描画が単列フォールバックになるため、入力側で制限する。

## 行動ルール

1. 距離 > `range` の場合は最短距離で移動。
2. 射程内かつ `cooldown === 0` で攻撃を発生させ、`hp` を減算。
3. HP ≤ 0 になったファイターは死亡扱い。残存チームが 1 つになったら勝敗確定。
4. `tickRate` に従って固定ステップで処理し、フレーム毎に BattleLog へ記録。

## パラメータ

| 名称       | 意味     | 補足                                    |
| ---------- | -------- | --------------------------------------- |
| `hpMax`    | 最大 HP  | `BattleSim.reset` 時に初期値へ復元。    |
| `atk`      | 攻撃力   | 1 攻撃あたりのダメージ。                |
| `range`    | 攻撃射程 | 攻撃圏と射程サークルを兼ねる。          |
| `speed`    | 移動速度 | px/s（固定タイムステップで使用）。      |
| `cooldown` | 攻撃間隔 | 秒。0 以下になったら攻撃→再設定。       |
| `aiType`   | 戦略 ID  | `AI_DEFINITIONS` に存在する値のみ有効。 |

## AI レジストリ

- `src/sim/ai/types.ts` の `AI_DEFINITIONS` が単一のソース・オブ・トゥルース。
- `AI_TYPES` / `AI_OPTIONS` は UI とシミュレーションで共有。
- 新規追加手順:
  1. `AI_DEFINITIONS` に `{ 新ID: { label: "表示名" } }` を追加。
  2. `src/sim/ai/index.ts` の `aiFactories` に実装を登録。
  3. 必要に応じてプリセットや UI で `aiType` を設定。
- `validation.ts` が未登録の `aiType` を検出して例外を投げるため、型・実装・入力検証が同期する。

## 決定論

- 乱数は `Mulberry32`（`src/sim/rng.ts`）で生成。`seed` が同一なら結果も再現。
- バトル開始時に `simulateBattle` が全フレームを事前計算し `BattleLog` に保存。
- ログは `window.$orbi.getLog()` やテストから直接参照できるため、Vitest で差分比較が可能。
- `BattleLog` は不変を前提に `structuredClone` で配布し、参照渡しによる副作用を防ぐ。
