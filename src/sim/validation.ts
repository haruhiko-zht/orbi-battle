import type { BattleConfig } from "./types";
import { TACTIC_IDS, isTacticId } from "./tactics/types";
import { getJobDefinition } from "./content/jobs";
import { getEquipmentDefinition } from "./content/equipment";
import { isEquipmentSlot } from "../types/content";

export type BattleConfigValidationOptions = {
  /**
   * チーム数の期待値。指定されていない場合は最小人数のみ検証。
   */
  expectedTeamCount?: number;
  /**
   * 必要な最小チーム数。デフォルトは1。
   */
  minTeams?: number;
};

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
export function validateBattleConfig(
  cfg: BattleConfig,
  options: BattleConfigValidationOptions = {}
) {
  if (!Number.isFinite(cfg.seed)) {
    throw new Error("BattleConfig.seed は有限数である必要があります");
  }
  assertFinitePositive(cfg.tickRate, "BattleConfig.tickRate");
  assertFinitePositive(cfg.arenaRadius, "BattleConfig.arenaRadius");

  const expectedTeams = options.expectedTeamCount ?? 2;
  const minTeams = options.minTeams ?? expectedTeams ?? 1;

  if (!Array.isArray(cfg.teams) || cfg.teams.length < minTeams) {
    throw new Error("BattleConfig.teams には 2 チーム以上が必要です");
  }

  if (typeof expectedTeams === "number" && cfg.teams.length !== expectedTeams) {
    throw new Error(
      `BattleConfig.teams は ${expectedTeams} チーム構成である必要があります`
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
        typeof fighter.tacticId !== "undefined" &&
        !isTacticId(fighter.tacticId)
      ) {
        throw new Error(
          `${basePath}.tacticId が不正です（${TACTIC_IDS.join("/")} のいずれか）`
        );
      }

      if (typeof fighter.jobId !== "undefined") {
        if (typeof fighter.jobId !== "string" || fighter.jobId.length === 0) {
          throw new Error(
            `${basePath}.jobId は空でない文字列である必要があります`
          );
        }
        if (!getJobDefinition(fighter.jobId)) {
          throw new Error(
            `${basePath}.jobId "${fighter.jobId}" は未登録の職業IDです`
          );
        }
      }

      if (typeof fighter.equipment !== "undefined") {
        if (
          fighter.equipment === null ||
          typeof fighter.equipment !== "object" ||
          Array.isArray(fighter.equipment)
        ) {
          throw new Error(
            `${basePath}.equipment はオブジェクトである必要があります`
          );
        }
        Object.entries(fighter.equipment).forEach(([slot, value]) => {
          if (typeof value !== "string") {
            throw new Error(
              `${basePath}.equipment[${slot}] は文字列の装備IDである必要があります`
            );
          }
          if (!isEquipmentSlot(slot)) {
            throw new Error(
              `${basePath}.equipment[${slot}] は有効な装備スロットではありません`
            );
          }
          const equipmentDef = getEquipmentDefinition(value);
          if (!equipmentDef) {
            throw new Error(
              `${basePath}.equipment[${slot}] "${value}" は未登録の装備IDです`
            );
          }
          if (equipmentDef.slot !== slot) {
            throw new Error(
              `${basePath}.equipment[${slot}] "${value}" は ${equipmentDef.slot} 用の装備です（装備スロットが一致しません）`
            );
          }
        });
      }
    });
  });
}
