import type { FighterState, Vec2 } from "../types";

export type NearestEnemyResult = {
  fighter: FighterState;
  delta: Vec2;
  distance: number;
};

/**
 * 2Dベクトルを正規化する。ゼロベクトルの場合は (0,0) を返す。
 */
export function normalizeVector(x: number, y: number): Vec2 {
  const length = Math.hypot(x, y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / length, y: y / length };
}

/**
 * 最も近い敵ファイターを探索し、相対ベクトルと距離を返す。
 */
export function findNearestEnemy(
  self: FighterState,
  enemies: FighterState[]
): NearestEnemyResult | null {
  if (enemies.length === 0) {
    return null;
  }

  let nearest = enemies[0];
  let minDist = distance(self, nearest);

  for (let i = 1; i < enemies.length; i += 1) {
    const candidate = enemies[i];
    const dist = distance(self, candidate);
    if (dist < minDist) {
      minDist = dist;
      nearest = candidate;
    }
  }

  const dx = nearest.pos.x - self.pos.x;
  const dy = nearest.pos.y - self.pos.y;
  return {
    fighter: nearest,
    delta: { x: dx, y: dy },
    distance: minDist,
  };
}

function distance(a: FighterState, b: FighterState): number {
  return Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y);
}
