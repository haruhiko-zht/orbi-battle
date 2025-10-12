import type { FighterState, Vec2 } from "../types";
import type { FighterAI, AIDecision } from "./types";

/**
 * ベクトルを正規化（長さ1にする）
 * @param x X成分
 * @param y Y成分
 * @returns 正規化されたベクトル
 */
function normalize(x: number, y: number): Vec2 {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
}

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
    const dist = Math.hypot(dx, dy);

    // 射程外なら接近、射程内なら停止して攻撃
    if (dist > self.params.range) {
      return {
        targetId: nearest.id,
        moveDirection: normalize(dx, dy),
      };
    } else {
      return {
        targetId: nearest.id,
        moveDirection: null, // 射程内なので移動しない
      };
    }
  }
}
