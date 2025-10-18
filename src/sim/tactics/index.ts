import { NearestTargetTactic } from "./nearestTarget";
import { AggressiveTactic } from "./aggressive";
import { DefensiveTactic } from "./defensive";
import {
  TACTIC_DEFINITIONS,
  type FighterTactic,
  type TacticId,
  type TacticDecision,
} from "./types";

export type { FighterTactic, TacticDecision, TacticId } from "./types";
export { TACTIC_DEFINITIONS, TACTIC_IDS, TACTIC_OPTIONS } from "./types";
export { NearestTargetTactic } from "./nearestTarget";
export { AggressiveTactic } from "./aggressive";
export { DefensiveTactic } from "./defensive";

const tacticFactories: Record<TacticId, () => FighterTactic> = {
  nearest: () => new NearestTargetTactic(),
  aggressive: () => new AggressiveTactic(),
  defensive: () => new DefensiveTactic(),
};

/**
 * 戦術インスタンスのキャッシュ（シングルトンパターン）
 */
const tacticCache = new Map<TacticId, FighterTactic>();

/**
 * 戦術 ID から戦術インスタンスを取得
 * @param id 戦術 ID
 * @returns 戦術インスタンス
 */
export function getTactic(id: TacticId): FighterTactic {
  if (!tacticCache.has(id)) {
    const factory = tacticFactories[id];
    if (!factory) {
      throw new Error(`未登録の戦術IDです: ${id}`);
    }
    tacticCache.set(id, factory());
  }
  return tacticCache.get(id)!;
}

/**
 * 登録済み戦術のラベルを取得
 */
export function getTacticLabel(id: TacticId): string {
  return TACTIC_DEFINITIONS[id]?.label ?? id;
}
