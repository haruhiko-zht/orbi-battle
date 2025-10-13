import type { PlacementStrategy } from "./types";
import type { BattleConfig, BattleState } from "../types";

export type RadialPlacementOptions = {
  /**
   * アリーナ半径に対する配置半径の割合（0〜1推奨）。
   * デフォルトは 0.7（外周から少し内側）。
   */
  radiusRatio?: number;
  /**
   * チーム0の開始角度（ラジアン）。デフォルトは π（画面下側の配置）。
   */
  baseRotation?: number;
};

/**
 * 円周上にチームごと等分で配置するラジアル配置戦略。
 */
export function createRadialPlacementStrategy(
  options: RadialPlacementOptions = {}
): PlacementStrategy {
  const radiusRatio = options.radiusRatio ?? 0.7;
  const baseRotation = options.baseRotation ?? Math.PI;

  return {
    place(config: BattleConfig): BattleState["fighters"] {
      const fighters: BattleState["fighters"] = [];
      const radius = config.arenaRadius * radiusRatio;
      const teamCount = Math.max(1, config.teams.length);
      const sectorSpan = (Math.PI * 2) / teamCount;

      config.teams.forEach((team, teamIndex) => {
        const members = team.fighters.length;
        const step = sectorSpan / Math.max(1, members + 1);
        const startAngle = baseRotation + sectorSpan * teamIndex;

        team.fighters.forEach((params, fighterIndex) => {
          const angle = startAngle + step * (fighterIndex + 1);
          fighters.push({
            id: `${team.id}-${fighterIndex}`,
            teamId: team.id,
            pos: {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
            },
            hp: params.hpMax,
            cooldown: 0,
            alive: true,
            params,
          });
        });
      });

      return fighters;
    },
  };
}

/**
 * 既定の初期配置戦略。
 */
export const defaultPlacementStrategy = createRadialPlacementStrategy();
