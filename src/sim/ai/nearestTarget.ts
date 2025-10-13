import type { FighterState } from "../types";
import type { FighterAI, AIDecision } from "./types";
import { findNearestEnemy, normalizeVector } from "./utils";

/**
 * 最も近い敵をターゲットにして接近・攻撃する AI
 * - 射程外なら接近
 * - 射程内なら攻撃
 */
export class NearestTargetAI implements FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    _arenaRadius: number
  ): AIDecision {
    const nearest = findNearestEnemy(self, enemies);
    if (!nearest) {
      return { targetId: null, moveDirection: null };
    }
    const dist = nearest.distance;

    // 射程外なら接近、射程内なら停止して攻撃
    if (dist > self.params.range) {
      return {
        targetId: nearest.fighter.id,
        moveDirection: normalizeVector(nearest.delta.x, nearest.delta.y),
      };
    } else {
      return {
        targetId: nearest.fighter.id,
        moveDirection: null, // 射程内なので移動しない
      };
    }
  }
}
