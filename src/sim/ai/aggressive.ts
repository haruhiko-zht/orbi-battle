import type { FighterState, Vec2 } from "../types";
import type { FighterAI, AIDecision } from "./types";

/**
 * ベクトルを正規化（長さ1にする）
 */
function normalize(x: number, y: number): Vec2 {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
}

/**
 * 攻撃的な AI
 * - 常に最も近い敵に向かって突進
 * - 射程内でも近づき続ける（密着戦闘）
 */
export class AggressiveAI implements FighterAI {
  decide(
    self: FighterState,
    enemies: FighterState[],
    _arenaRadius: number
  ): AIDecision {
    if (enemies.length === 0) {
      return { targetId: null, moveDirection: null };
    }

    // 最も近い敵を選択
    let nearest = enemies[0];
    let minDist = Math.hypot(
      nearest.pos.x - self.pos.x,
      nearest.pos.y - self.pos.y
    );

    for (const enemy of enemies) {
      const dist = Math.hypot(
        enemy.pos.x - self.pos.x,
        enemy.pos.y - self.pos.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }

    const dx = nearest.pos.x - self.pos.x;
    const dy = nearest.pos.y - self.pos.y;

    // 常に接近し続ける（射程内でも移動）
    return {
      targetId: nearest.id,
      moveDirection: normalize(dx, dy),
    };
  }
}
