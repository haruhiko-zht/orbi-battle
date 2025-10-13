import Phaser from "phaser";
import type { BattleState, FighterState } from "../sim/types";
import type { BattleSides } from "../sim/sides";
import { resolveFighterSides } from "../sim/sides";
import {
  FIGHTER,
  FIGHTER_RANGE,
  HP_BAR,
  HP_TEXT,
} from "../config/renderConstants";

type TeamColorResolver = (teamId: string) => number;
type SceneCenter = { x: number; y: number };

export class FighterObjectManager {
  private fighters = new Map<string, Phaser.GameObjects.Arc>();
  private ranges = new Map<string, Phaser.GameObjects.Arc>();

  constructor(private readonly scene: Phaser.Scene) {}

  rebuild(
    state: BattleState,
    center: SceneCenter,
    getTeamColor: TeamColorResolver
  ) {
    this.destroy();
    for (const fighter of state.fighters) {
      this.createFighter(fighter, center, getTeamColor);
    }
  }

  update(
    state: BattleState,
    center: SceneCenter,
    getTeamColor: TeamColorResolver
  ) {
    for (const fighter of state.fighters) {
      const circle = this.fighters.get(fighter.id);
      const rangeCircle = this.ranges.get(fighter.id);
      if (!circle || !rangeCircle) continue;
      const color = getTeamColor(fighter.teamId);
      circle
        .setPosition(center.x + fighter.pos.x, center.y + fighter.pos.y)
        .setAlpha(fighter.alive ? FIGHTER.aliveAlpha : FIGHTER.deadAlpha);
      const strokeAlpha = fighter.alive
        ? FIGHTER_RANGE.strokeAlphaAlive
        : FIGHTER_RANGE.strokeAlphaDead;
      const fillAlpha = fighter.alive
        ? FIGHTER_RANGE.fillAlphaAlive
        : FIGHTER_RANGE.fillAlphaDead;
      rangeCircle
        .setPosition(center.x + fighter.pos.x, center.y + fighter.pos.y)
        .setFillStyle(color, fillAlpha)
        .setStrokeStyle(FIGHTER_RANGE.strokeWidth, color, strokeAlpha);
    }
  }

  destroy() {
    for (const circle of this.fighters.values()) {
      circle.destroy();
    }
    for (const rangeCircle of this.ranges.values()) {
      rangeCircle.destroy();
    }
    this.fighters.clear();
    this.ranges.clear();
  }

  private createFighter(
    fighter: FighterState,
    center: SceneCenter,
    getTeamColor: TeamColorResolver
  ) {
    const color = getTeamColor(fighter.teamId);
    const rangeCircle = this.scene.add
      .circle(
        center.x,
        center.y,
        fighter.params.range,
        color,
        FIGHTER_RANGE.fillAlphaAlive
      )
      .setStrokeStyle(
        FIGHTER_RANGE.strokeWidth,
        color,
        FIGHTER_RANGE.strokeAlphaAlive
      );
    this.ranges.set(fighter.id, rangeCircle);

    const circle = this.scene.add.circle(
      center.x,
      center.y,
      FIGHTER.radius,
      color
    );
    this.fighters.set(fighter.id, circle);
  }
}

export class HpHudRenderer {
  private hpBars = new Map<string, Phaser.GameObjects.Graphics>();
  private hpTexts = new Map<string, Phaser.GameObjects.Text>();

  constructor(private readonly scene: Phaser.Scene) {}

  rebuild(
    state: BattleState,
    sides: BattleSides,
    width: number,
    height: number,
    getTeamColor: TeamColorResolver
  ) {
    this.destroy();
    for (const fighter of state.fighters) {
      this.hpBars.set(fighter.id, this.scene.add.graphics());
      this.hpTexts.set(
        fighter.id,
        this.scene.add.text(0, 0, "", {
          color: HP_TEXT.color,
          fontSize: HP_TEXT.fontSize,
          fontFamily: HP_TEXT.fontFamily,
        })
      );
    }
    this.update(state, sides, width, height, getTeamColor);
  }

  update(
    state: BattleState,
    sides: BattleSides,
    width: number,
    height: number,
    getTeamColor: TeamColorResolver
  ) {
    const { ally, enemy } = resolveFighterSides(state, sides);
    const barWidth = HP_BAR.width;
    const barHeight = HP_BAR.height;
    const padding = HP_BAR.padding;
    const leftOffset = HP_BAR.leftOffset;
    const rightOffset = width - barWidth - leftOffset;

    let enemyY = height - barHeight;
    for (const fighter of enemy) {
      this.renderHpBar(
        fighter,
        leftOffset,
        enemyY,
        barWidth,
        barHeight,
        getTeamColor
      );
      enemyY -= barHeight + padding;
    }

    let allyY = height - barHeight;
    for (const fighter of ally) {
      this.renderHpBar(
        fighter,
        rightOffset,
        allyY,
        barWidth,
        barHeight,
        getTeamColor
      );
      allyY -= barHeight + padding;
    }
  }

  destroy() {
    for (const bar of this.hpBars.values()) {
      bar.destroy();
    }
    for (const text of this.hpTexts.values()) {
      text.destroy();
    }
    this.hpBars.clear();
    this.hpTexts.clear();
  }

  private renderHpBar(
    fighter: FighterState,
    x: number,
    y: number,
    width: number,
    height: number,
    getTeamColor: TeamColorResolver
  ) {
    const bar = this.hpBars.get(fighter.id);
    const text = this.hpTexts.get(fighter.id);
    if (!bar || !text) return;
    bar.clear();
    const ratio = fighter.params.hpMax
      ? Phaser.Math.Clamp(fighter.hp / fighter.params.hpMax, 0, 1)
      : 0;
    const color = getTeamColor(fighter.teamId);
    bar.fillStyle(HP_BAR.backgroundColor).fillRect(x, y, width, height);
    bar.fillStyle(color).fillRect(x, y, width * ratio, height);

    const label = `${fighter.id}: ${fighter.hp.toFixed(1)} / ${
      fighter.params.hpMax
    }`;
    text.setText(label);
    text.setPosition(
      x + width / 2 - text.width / 2,
      y + height / 2 - text.height / 2
    );
  }
}
