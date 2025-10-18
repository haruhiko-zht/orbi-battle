# シミュレーション仕様

## 概要

`src/sim/` は描画や UI に依存しない純粋ロジック層です。固定タイムステップで状態を進め、最終的な `BattleLog` を返します。バトルは常に 2 チーム（`teams[0]`=味方、`teams[1]`=敵）構成を前提にしています。

## 状態モデル

- **FighterParams / FighterState** — ファイターのパラメータと現在値。`tacticId` が未指定なら `nearest` を自動適用。
- **BattleState** — 1 フレームのスナップショット。配置・HP・死亡フラグ・勝敗を保持し不変。
- **BattleLog** — `config` と `BattleState[]` の組。`simulateBattle` が生成し、`BattleSim` が再生ヘルパーを提供。
- **Engine** — `tickRate` ベースで状態を更新し、勝敗判定と死亡管理を行う。
- **Validation** — `validation.ts` が入力構成を検証し、未知の戦術 ID や異常値を即座に弾きます。

## 進行ロジック（1 フレーム）

1. 存命ファイターを列挙し、`tacticId` に応じてターゲットと移動方向を決定。
2. 距離が `range` を超える場合は正規化ベクトルで移動。射程内かつ `cooldown <= 0` で攻撃を解決。
3. 攻撃が命中すると `hp` を減算し、0 以下で死亡扱い。
4. チームの生存数を評価し、単一チームのみなら勝敗確定。
5. 更新結果を `BattleState` に記録して `BattleLog` へ追加。

## パラメータの扱い

| プロパティ | 役割                                | メモ                                            |
| ---------- | ----------------------------------- | ----------------------------------------------- |
| `hpMax`    | 最大 HP。`BattleSim.reset` で復元。 | 80〜120 を基準。                                |
| `atk`      | 攻撃力。1 回あたりのダメージ。      | `cooldown` と組み合わせて DPS を調整。          |
| `range`    | 攻撃射程（px）。                    | 描画の射程サークルと共有。                      |
| `speed`    | 移動速度（px/s）。                  | 固定タイムステップで使用。                      |
| `cooldown` | 攻撃間隔（秒）。                    | 0 以下で攻撃し、リセットされる。                |
| `tacticId` | 戦術 ID。                           | `TACTIC_DEFINITIONS` に定義されたもののみ有効。 |

## 戦術レジストリ

- 単一のソース・オブ・トゥルースは `src/sim/tactics/types.ts` の `TACTIC_DEFINITIONS`。
- 実装は `src/sim/tactics/index.ts` の `tacticFactories` に登録し、UI は `TACTIC_OPTIONS` を参照します。
- 追加手順: `TACTIC_DEFINITIONS` → `tacticFactories` → 必要ならプリセット更新 → `__tests__/tactics.test.ts` で決定論を確認。
- 未登録 ID を受け取ると `validation.ts` が例外を投げ、ログ生成前に失敗させます。

## 決定論とログ

- 乱数は `Mulberry32`（`src/sim/rng.ts`）。`seed` が同じなら必ず同じ `BattleLog` を生成。
- `BattleSim` は生成済みログを `structuredClone` で配布し、副作用を遮断。
- テストからは `simulateBattle` 直呼び出し、または `window.$orbi.getLog()` でログ差分を比較できます。
