import type { BattleConfig, BattleState, FighterState } from "../types";
import type { TacticDecision } from "../tactics/types";

/**
 * 各システムに渡す共通コンテキスト
 */
export type FighterSystemContext = {
  self: FighterState;
  decision: TacticDecision;
  state: BattleState;
  config: BattleConfig;
  dt: number;
};

/**
 * ファイター単位で逐次適用されるシステムインターフェース
 */
export interface FighterSystem {
  update(context: FighterSystemContext): void;
}
