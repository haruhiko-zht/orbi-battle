import type { FighterState } from "../types";
import type { FighterTactic, TacticDecision } from "./types";
import { findNearestEnemy, normalizeVector } from "./utils";

/**
 * 攻撃的な戦術
 * - 常に最も近い敵に向かって突進
 * - 射程内でも近づき続ける（密着戦闘）
 */
export class AggressiveTactic implements FighterTactic {
  decide(
    self: FighterState,
    enemies: FighterState[],
    _arenaRadius: number
  ): TacticDecision {
    const nearest = findNearestEnemy(self, enemies);
    if (!nearest) {
      return { targetId: null, moveDirection: null };
    }

    // 常に接近し続ける（射程内でも移動）
    return {
      targetId: nearest.fighter.id,
      moveDirection: normalizeVector(nearest.delta.x, nearest.delta.y),
    };
  }
}
