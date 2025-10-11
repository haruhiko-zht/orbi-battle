import type { BattleConfig, BattleState, Vec2 } from "./types";
import { makeRng } from "./rng";

function clampToCircle(p: Vec2, r: number): Vec2 {
  const d2 = p.x * p.x + p.y * p.y;
  if (d2 <= r * r) return p;
  const d = Math.sqrt(d2);
  return { x: (p.x / d) * r, y: (p.y / d) * r };
}

function norm(x: number, y: number) {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
}

export class Engine {
  readonly cfg: BattleConfig;
  readonly dt: number;
  private rng: () => number;
  state: BattleState;

  constructor(cfg: BattleConfig) {
    this.cfg = cfg;
    this.dt = 1 / cfg.tickRate;
    this.rng = makeRng(cfg.seed);

    // 初期配置: 円内の対向位置
    const r = cfg.arenaRadius * 0.7;
    this.state = {
      t: 0,
      winner: null,
      a: {
        id: "A",
        pos: { x: -r, y: 0 },
        hp: cfg.fighterA.hpMax,
        cooldown: 0,
        alive: true,
        params: cfg.fighterA,
      },
      b: {
        id: "B",
        pos: { x: +r, y: 0 },
        hp: cfg.fighterB.hpMax,
        cooldown: 0,
        alive: true,
        params: cfg.fighterB,
      },
    };
  }

  private stepFighter(self: BattleState["a"], enemy: BattleState["b"]) {
    if (!self.alive) return;
    const dx = enemy.pos.x - self.pos.x;
    const dy = enemy.pos.y - self.pos.y;
    const dist = Math.hypot(dx, dy);

    // クールダウン更新
    if (self.cooldown > 0) self.cooldown = Math.max(0, self.cooldown - this.dt);

    // 基本AI: 間合い維持 -> 近づく -> 攻撃
    const p = self.params;
    if (dist > p.range) {
      const v = norm(dx, dy);
      self.pos.x += v.x * p.speed * this.dt;
      self.pos.y += v.y * p.speed * this.dt;
    } else {
      // 攻撃判定（接触ベース）
      if (self.cooldown === 0 && enemy.alive) {
        enemy.hp -= p.atk;
        self.cooldown = p.cooldown;
        if (enemy.hp <= 0) {
          enemy.alive = false;
          enemy.hp = 0;
        }
      }
    }

    // 円形境界にクランプ
    self.pos = clampToCircle(self.pos, this.cfg.arenaRadius);
  }

  update(): BattleState {
    const s = this.state;
    if (!s.winner) {
      this.stepFighter(s.a, s.b);
      this.stepFighter(s.b, s.a);
      if (!s.a.alive || !s.b.alive) {
        s.winner = !s.a.alive ? "B" : "A";
      }
      s.t += this.dt;
    }
    return s;
  }
}
