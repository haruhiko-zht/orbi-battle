import Phaser from "phaser";
import type { BattleConfig } from "../sim/types";
import { BattleSim } from "../sim/battle";
import { defaults } from "../config/defaults";

export class BattleScene extends Phaser.Scene {
  sim!: BattleSim;
  cfg: BattleConfig = structuredClone(defaults);
  arena!: Phaser.GameObjects.Arc;
  a!: Phaser.GameObjects.Arc;
  b!: Phaser.GameObjects.Arc;
  aHp!: Phaser.GameObjects.Graphics;
  bHp!: Phaser.GameObjects.Graphics;
  aHpText!: Phaser.GameObjects.Text;
  bHpText!: Phaser.GameObjects.Text;
  result!: Phaser.GameObjects.Text;

  constructor() {
    super("Battle");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0e0f13");
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.sim = new BattleSim(this.cfg);

    // Arena (circle)
    this.arena = this.add
      .circle(cx, cy, this.cfg.arenaRadius, 0x0, 0)
      .setStrokeStyle(2, 0x4a90e2);

    // Fighters
    this.a = this.add.circle(cx - this.cfg.arenaRadius * 0.7, cy, 10, 0x7bd389);
    this.b = this.add.circle(cx + this.cfg.arenaRadius * 0.7, cy, 10, 0xf97070);

    // HP bars
    this.aHp = this.add.graphics();
    this.bHp = this.add.graphics();
    this.aHpText = this.add.text(0, 0, "", {
      color: "#ffffff",
      fontSize: "12px",
      fontFamily: "monospace",
    });
    this.bHpText = this.add.text(0, 0, "", {
      color: "#ffffff",
      fontSize: "12px",
      fontFamily: "monospace",
    });

    this.result = this.add.text(12, 12, "", { color: "#ffffff" });

    // expose reset for UI
    // @ts-expect-error
    window.$orbi = {
      ...(window as any).$orbi,
      reset: (cfg: BattleConfig) => this.reset(cfg),
    };
  }

  reset(cfg: BattleConfig) {
    this.cfg = structuredClone(cfg);
    this.sim.reset(this.cfg);
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.a.setPosition(cx - this.cfg.arenaRadius * 0.7, cy);
    this.b.setPosition(cx + this.cfg.arenaRadius * 0.7, cy);
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05); // clamp large frame gaps
    const state = this.sim.fixedUpdate(dt);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Fighters
    // state.pos は原点(0,0)基準 → 画面中心へ移動
    this.a.setPosition(cx + state.a.pos.x, cy + state.a.pos.y);
    this.b.setPosition(cx + state.b.pos.x, cy + state.b.pos.y);

    // HP bars
    const w = 320,
      h = 8;
    const pad = 6;
    this.aHp.clear();
    this.bHp.clear();

    const aRatio = state.a.hp / state.a.params.hpMax;
    const bRatio = state.b.hp / state.b.params.hpMax;

    const aY = this.scale.height - 2 * h - pad;
    const bY = this.scale.height - h;

    // 背景バー
    this.aHp.fillStyle(0x333333).fillRect(20, aY, w, h);
    this.bHp.fillStyle(0x333333).fillRect(20, bY, w, h);

    // 残量バー
    this.aHp.fillStyle(0x7bd389).fillRect(20, aY, w * aRatio, h);
    this.bHp.fillStyle(0xf97070).fillRect(20, bY, w * bRatio, h);

    // HP Text Centered (バー中央に重ねる)
    const aHpText = `${state.a.hp.toFixed(1)} / ${state.a.params.hpMax}`;
    const bHpText = `${state.b.hp.toFixed(1)} / ${state.b.params.hpMax}`;

    this.aHpText.setText(aHpText);
    this.bHpText.setText(bHpText);

    this.aHpText.setPosition(
      20 + w / 2 - this.aHpText.width / 2,
      aY + h / 2 - this.aHpText.height / 2
    );
    this.bHpText.setPosition(
      20 + w / 2 - this.bHpText.width / 2,
      bY + h / 2 - this.bHpText.height / 2
    );

    this.result.setText(state.winner ? `WINNER: ${state.winner}` : "");
  }
}
