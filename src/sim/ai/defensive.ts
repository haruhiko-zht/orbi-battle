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

    const range = self.params.range;
    const safeDistance = range * 0.8; // 射程の80%を安全距離とする

    if (dist < safeDistance) {
      // 近すぎる場合は距離を取る
      return {
        targetId: nearest.id,
        moveDirection: normalize(-dx, -dy), // 敵から離れる方向
      };
    } else if (dist > range) {
      // 射程外なら接近
      return {
        targetId: nearest.id,
        moveDirection: normalize(dx, dy),
      };
    } else {
      // 適切な距離（射程80%〜100%）なら停止して攻撃
      return {
        targetId: nearest.id,
        moveDirection: null,
      };
    }
  }
}
