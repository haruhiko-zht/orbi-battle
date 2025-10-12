import type { BattleConfig } from "./types";

/** 許可されている AI タイプ（ランタイム検証用） */
const VALID_AI_TYPES = new Set(["nearest", "aggressive", "defensive"]);

/**
 * 数値が有限かつ 0 より大きい（allowZero=true の場合は 0 以上）であることを検証
 */
export function assertFinitePositive(
  value: number,
  fieldPath: string,
  options?: { allowZero?: boolean }
) {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldPath} は有限数である必要があります`);
  }
  const allowZero = options?.allowZero ?? false;
  const isValid = allowZero ? value >= 0 : value > 0;
  if (!isValid) {
    throw new Error(
      `${fieldPath} は ${allowZero ? "0以上" : "0より大きい"}である必要があります`
    );
  }
}

/**
 * BattleConfig の妥当性を検証し、異常値があれば例外を投げる
 * - 想定外の設定値でシミュレーションが暴走するのを防ぐ
 */
export function validateBattleConfig(cfg: BattleConfig) {
  if (!Number.isFinite(cfg.seed)) {
    throw new Error("BattleConfig.seed は有限数である必要があります");
  }
  assertFinitePositive(cfg.tickRate, "BattleConfig.tickRate");
  assertFinitePositive(cfg.arenaRadius, "BattleConfig.arenaRadius");

  if (!Array.isArray(cfg.teams) || cfg.teams.length === 0) {
    throw new Error("BattleConfig.teams には 1 チーム以上が必要です");
  }

  if (cfg.teams.length !== 2) {
    throw new Error(
      "BattleConfig.teams は味方・敵の2チーム構成である必要があります"
    );
  }

  cfg.teams.forEach((team, teamIndex) => {
    if (typeof team.id !== "string" || team.id.length === 0) {
      throw new Error(
        `BattleConfig.teams[${teamIndex}].id は空でない文字列である必要があります`
      );
    }
    if (!Array.isArray(team.fighters) || team.fighters.length === 0) {
      throw new Error(
        `BattleConfig.teams[${teamIndex}].fighters には 1 体以上が必要です`
      );
    }

    team.fighters.forEach((fighter, fighterIndex) => {
      const basePath = `BattleConfig.teams[${teamIndex}].fighters[${fighterIndex}]`;
      assertFinitePositive(fighter.hpMax, `${basePath}.hpMax`);
      assertFinitePositive(fighter.atk, `${basePath}.atk`);
      assertFinitePositive(fighter.range, `${basePath}.range`);
      assertFinitePositive(fighter.speed, `${basePath}.speed`, {
        allowZero: true,
      });
      assertFinitePositive(fighter.cooldown, `${basePath}.cooldown`, {
        allowZero: true,
      });

      if (
        typeof fighter.aiType !== "undefined" &&
        !VALID_AI_TYPES.has(fighter.aiType)
      ) {
        throw new Error(
          `${basePath}.aiType が不正です（nearest/aggressive/defensive のいずれか）`
        );
      }
    });
  });
}
