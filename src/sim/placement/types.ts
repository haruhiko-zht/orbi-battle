import type { BattleConfig, BattleState } from "../types";

/**
 * ファイター初期配置を生成する戦略インターフェース。
 */
export interface PlacementStrategy {
  /**
   * BattleConfig をもとに初期のファイター状態配列を生成する。
   */
  place(config: BattleConfig): BattleState["fighters"];
}
