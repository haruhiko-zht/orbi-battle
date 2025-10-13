import type { FighterSystem, FighterSystemContext } from "./types";

function clampToCircle(x: number, y: number, radius: number) {
  const d2 = x * x + y * y;
  if (d2 <= radius * radius) {
    return { x, y };
  }
  const d = Math.sqrt(d2);
  const scale = radius / d;
  return {
    x: x * scale,
    y: y * scale,
  };
}

class CooldownSystem implements FighterSystem {
  update({ self, dt }: FighterSystemContext) {
    if (self.cooldown > 0) {
      self.cooldown = Math.max(0, self.cooldown - dt);
    }
  }
}

class MovementSystem implements FighterSystem {
  update({ self, decision, dt }: FighterSystemContext) {
    const direction = decision.moveDirection;
    if (!direction) return;
    const mag = Math.hypot(direction.x, direction.y);
    if (mag === 0) return;
    const nx = direction.x / mag;
    const ny = direction.y / mag;
    self.pos.x += nx * self.params.speed * dt;
    self.pos.y += ny * self.params.speed * dt;
  }
}

class AttackSystem implements FighterSystem {
  update({ self, decision, state }: FighterSystemContext) {
    if (!decision.targetId || self.cooldown !== 0) return;
    const target = state.fighters.find((f) => f.id === decision.targetId);
    if (!target || !target.alive) return;
    const dist = Math.hypot(
      target.pos.x - self.pos.x,
      target.pos.y - self.pos.y
    );
    if (dist > self.params.range) {
      return;
    }
    target.hp -= self.params.atk;
    self.cooldown = self.params.cooldown;
    if (target.hp <= 0) {
      target.alive = false;
      target.hp = 0;
    }
  }
}

class ArenaConstraintSystem implements FighterSystem {
  update({ self, config }: FighterSystemContext) {
    const clamped = clampToCircle(self.pos.x, self.pos.y, config.arenaRadius);
    self.pos.x = clamped.x;
    self.pos.y = clamped.y;
  }
}

/**
 * デフォルトで適用するシステム群を生成
 */
export function createDefaultFighterSystems(): FighterSystem[] {
  return [
    new CooldownSystem(),
    new MovementSystem(),
    new AttackSystem(),
    new ArenaConstraintSystem(),
  ];
}

export type { FighterSystem } from "./types";
