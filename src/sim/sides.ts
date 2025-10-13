import type { BattleConfig, BattleState, FighterState } from "./types";

export type BattleTeam = BattleConfig["teams"][number];

/**
 * BattleConfig 内のチームを順序付きで表すメタ情報。
 */
export type BattleTeamInfo = {
  /** コンフィグ内でのインデックス（0始まり） */
  index: number;
  /** チームID */
  id: string;
  /** チーム設定本体 */
  team: BattleTeam;
};

/**
 * 指定チームに紐づくファイター一覧。
 */
export type TeamFighterGroup = {
  info: BattleTeamInfo;
  fighters: FighterState[];
};

/**
 * BattleConfig からチーム情報を取得（順序は定義通り）。
 */
export function resolveBattleTeams(cfg: BattleConfig): BattleTeamInfo[] {
  // NOTE: 本プロジェクトは仕様として 2 チーム（味方/敵）固定。
  // 多人数戦は対象外のため、ここで厳格にチェックして早期に気付けるようにしている。
  if (cfg.teams.length !== 2) {
    throw new Error(
      `[resolveBattleTeams] 2チーム構成（味方/敵）である必要があります。現在のチーム数: ${cfg.teams.length}`
    );
  }
  return cfg.teams.map((team, index) => ({
    index,
    id: team.id,
    team,
  }));
}

/**
 * 描画やロジック向けにファイターをチームごとへ分類。
 * - 配列順はコンフィグのチーム順と一致
 * - 未知のチームIDは警告を出しつつ末尾に追加
 */
export function groupFightersByTeam(
  state: BattleState,
  teams: readonly BattleTeamInfo[]
): TeamFighterGroup[] {
  const fighterBuckets = new Map<string, FighterState[]>();
  teams.forEach((team) => {
    fighterBuckets.set(team.id, []);
  });

  for (const fighter of state.fighters) {
    if (!fighterBuckets.has(fighter.teamId)) {
      console.warn(
        `[groupFightersByTeam] 未知のteamIdを検出: ${fighter.teamId}. BattleConfigに登録されていません。`
      );
      fighterBuckets.set(fighter.teamId, []);
    }
    fighterBuckets.get(fighter.teamId)!.push(fighter);
  }

  const orderedGroups = teams.map((team) => ({
    info: team,
    fighters: sortFightersById(fighterBuckets.get(team.id) ?? []),
  }));

  // BattleConfigに存在しないチームIDのファイターを末尾に追加
  const extraGroups: TeamFighterGroup[] = [];
  fighterBuckets.forEach((fighters, teamId) => {
    const existsInConfig = teams.some((team) => team.id === teamId);
    if (!existsInConfig) {
      extraGroups.push({
        info: {
          id: teamId,
          index: Number.MAX_SAFE_INTEGER,
          team: {
            id: teamId,
            fighters: fighters.map((fighter) => fighter.params),
          },
        },
        fighters: sortFightersById(fighters),
      });
    }
  });

  return [...orderedGroups, ...extraGroups];
}

/**
 * 同一チーム内で安定ソート（ID順）。
 */
export function sortFightersById(fighters: FighterState[]): FighterState[] {
  return [...fighters].sort((a, b) => a.id.localeCompare(b.id));
}
