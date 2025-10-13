import Phaser from "phaser";
import type { BattleState, FighterState } from "../sim/types";
import type { BattleTeamInfo, TeamFighterGroup } from "../sim/sides";
import { groupFightersByTeam } from "../sim/sides";
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

type HpHudLayoutContext = {
  teams: TeamFighterGroup[];
  viewportWidth: number;
  viewportHeight: number;
  barWidth: number;
  barHeight: number;
  padding: number;
  leftOffset: number;
};

type HpHudPlacement = {
  fighter: FighterState;
  x: number;
  y: number;
};

export type HpHudLayoutStrategy = (
  context: HpHudLayoutContext
) => HpHudPlacement[];

const defaultHpHudLayout: HpHudLayoutStrategy = ({
  teams,
  viewportWidth,
  viewportHeight,
  barWidth,
  barHeight,
  padding,
  leftOffset,
}) => {
  if (teams.length === 0) {
    return [];
  }

  const placements: HpHudPlacement[] = [];
  const baseY = viewportHeight - barHeight;
  const columnXs = computeColumnPositions(
    teams.length,
    viewportWidth,
    barWidth,
    padding,
    leftOffset
  );

  teams.forEach((group, columnIndex) => {
    let currentY = baseY;
    for (const fighter of group.fighters) {
      placements.push({
        fighter,
        x: columnXs[columnIndex],
        y: currentY,
      });
      currentY -= barHeight + padding;
    }
  });

  return placements;
};

function computeColumnPositions(
  teamCount: number,
  viewportWidth: number,
  barWidth: number,
  padding: number,
  leftOffset: number
): number[] {
  if (teamCount === 1) {
    const centered = (viewportWidth - barWidth) / 2;
    return [Math.max(leftOffset, centered)];
  }
  if (teamCount === 2) {
    return [
      viewportWidth - barWidth - leftOffset, // team index 0 -> 右側
      leftOffset, // team index 1 -> 左側
    ];
  }

  const totalWidth = barWidth * teamCount + padding * (teamCount - 1);
  const startX = Math.max(leftOffset, (viewportWidth - totalWidth) / 2);
  return Array.from({ length: teamCount }, (_, index) => {
    return startX + index * (barWidth + padding);
  });
}

export class HpHudRenderer {
  private hpBars = new Map<string, Phaser.GameObjects.Graphics>();
  private hpTexts = new Map<string, Phaser.GameObjects.Text>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layout: HpHudLayoutStrategy = defaultHpHudLayout
  ) {}

  rebuild(
    state: BattleState,
    teams: readonly BattleTeamInfo[],
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
    this.update(state, teams, width, height, getTeamColor);
  }

  update(
    state: BattleState,
    teams: readonly BattleTeamInfo[],
    width: number,
    height: number,
    getTeamColor: TeamColorResolver
  ) {
    const grouped = groupFightersByTeam(state, teams);
    const barWidth = HP_BAR.width;
    const barHeight = HP_BAR.height;
    const padding = HP_BAR.padding;
    const leftOffset = HP_BAR.leftOffset;

    const placements = this.layout({
      teams: grouped,
      viewportWidth: width,
      viewportHeight: height,
      barWidth,
      barHeight,
      padding,
      leftOffset,
    });

    for (const placement of placements) {
      this.renderHpBar(
        placement.fighter,
        placement.x,
        placement.y,
        barWidth,
        barHeight,
        getTeamColor
      );
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
