import type { BattleConfig, BattleState, FighterState } from "./types";

export type BattleTeam = BattleConfig["teams"][number];

export type BattleSides = {
  ally: BattleTeam;
  enemy: BattleTeam;
};

export type FighterSides = {
  ally: FighterState[];
  enemy: FighterState[];
};

/**
 * BattleConfig から味方・敵チームを抽出
 * - 現仕様では必ず2チーム（味方/敵）のみを許容
 * - 将来的に仕様が変わる場合はここを更新する
 */
export function resolveBattleSides(cfg: BattleConfig): BattleSides {
  if (cfg.teams.length !== 2) {
    throw new Error(
      `[BattleConfig] 2チーム構成が必須です (ally/enemy)。現在のチーム数: ${cfg.teams.length}`
    );
  }
  return {
    ally: cfg.teams[0],
    enemy: cfg.teams[1],
  };
}

/**
 * FighterState 配列を味方・敵に分類
 * - チームIDは BattleConfig 由来の順序と一致している前提
 */
export function splitFightersBySide(
  fighters: FighterState[],
  sides: BattleSides
): FighterSides {
  const allyId = sides.ally.id;
  const enemyId = sides.enemy.id;

  const ally: FighterState[] = [];
  const enemy: FighterState[] = [];

  for (const fighter of fighters) {
    if (fighter.teamId === allyId) {
      ally.push(fighter);
    } else if (fighter.teamId === enemyId) {
      enemy.push(fighter);
    } else {
      // 2チーム以外のIDは現仕様では異常値とみなす
      console.warn(
        `[splitFightersBySide] 未知のteamIdを検出: ${fighter.teamId} (期待: ${allyId}/${enemyId})`
      );
    }
  }

  return { ally, enemy };
}

/**
 * 描画用にファイターを安定ソート
 * - 同一チーム内ではID順
 */
export function sortFightersBySide(fighters: FighterState[]): FighterState[] {
  return [...fighters].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * BattleState から現在の味方/敵ファイター一覧を取得
 */
export function resolveFighterSides(
  state: BattleState,
  sides: BattleSides
): FighterSides {
  const { ally, enemy } = splitFightersBySide(state.fighters, sides);
  return {
    ally: sortFightersBySide(ally),
    enemy: sortFightersBySide(enemy),
  };
}
