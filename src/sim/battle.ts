import type { BattleConfig, BattleState } from "./types";
import { Engine } from "./engine";

export class BattleSim {
  engine: Engine;
  acc = 0;
  running = true;

  constructor(cfg: BattleConfig) {
    this.engine = new Engine(cfg);
  }

  // 固定タイムステップ: 外部から可変dtを与えて蓄積 → 1/Hz で進める
  fixedUpdate(dt: number): BattleState {
    if (!this.running) return this.engine.state;
    const step = this.engine.dt;
    this.acc += dt;
    while (this.acc >= step) {
      this.engine.update();
      this.acc -= step;
    }
    return this.engine.state;
  }

  reset(cfg: BattleConfig) {
    this.engine = new Engine(cfg);
    this.acc = 0;
    this.running = true;
  }
}
