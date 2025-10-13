import type { FighterState } from "../types";
import type { FighterAI, AIDecision } from "./types";
import { findNearestEnemy, normalizeVector } from "./utils";

/**
 * 防御的な AI
 * - 敵が射程の80%以内に近づいたら距離を取る
 * - 射程ギリギリから攻撃（キープディスタンス戦法）
 */
export class DefensiveAI implements FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    _arenaRadius: number
  ): AIDecision {
    const nearest = findNearestEnemy(self, enemies);
    if (!nearest) {
      return { targetId: null, moveDirection: null };
    }
    const { delta, fighter, distance: dist } = nearest;

    const range = self.params.range;
    const safeDistance = range * 0.8; // 射程の80%を安全距離とする

    if (dist < safeDistance) {
      // 近すぎる場合は距離を取る
      return {
        targetId: fighter.id,
        moveDirection: normalizeVector(-delta.x, -delta.y), // 敵から離れる方向
      };
    } else if (dist > range) {
      // 射程外なら接近
      return {
        targetId: fighter.id,
        moveDirection: normalizeVector(delta.x, delta.y),
      };
    } else {
      // 適切な距離（射程80%〜100%）なら停止して攻撃
      return {
        targetId: fighter.id,
        moveDirection: null,
      };
    }
  }
}
